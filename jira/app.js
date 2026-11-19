'use strict';

const SUPABASE_URL = 'https://rqozyhhzosvcohtiybqo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TP9DnsXbTohgSbmckxf6ZQ_QeoYfRCU';
const BUCKET = 'gnb-edge-docs';
const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES = ['High', 'Normal', 'Low'];
const FIELDS = ['title','scope','priority','status','description','acceptance','assignee_email','backend_url','frontend_url','due_date'];
const FIELD_LABELS = {title:'Title',scope:'App view',priority:'Priority',status:'Status',description:'Work details',acceptance:'Done when',assignee_email:'Assignee',backend_url:'Backend URL',frontend_url:'Frontend URL',due_date:'Due date',archived_at:'Archived',created:'Created'};
const BUILTIN_DOC = {id:'release',title:'22 Nov Driver App Release',kind:'html',file_name:'Release handoff',builtin:true};

const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
const main = document.getElementById('main');
const account = document.getElementById('account');
const modal = document.getElementById('modal');
const notice = document.getElementById('notice');
const filter = {search:'', assignee:''};
const state = {tasks:[],members:[],docs:[],error:'',ready:false};
let activeView = 0;
let loadVersion = 0;
let noticeTimer;
let docUrl;
let drag;
let suppressCardClick=false;
const pendingMoves = new Set();

const html = value => String(value ?? '').replace(/[&<>"']/g, symbol => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[symbol]);
const displayDate = value => value ? new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '';
const displayDue = value => value ? new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value)) : '';
const initials = value => String(value).trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase();
const memberName = email => state.members.find(member => member.email === email)?.name || email || 'Unassigned';

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function inform(message, error = false) {
  clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.classList.toggle('error', error);
  noticeTimer = setTimeout(() => { notice.textContent = ''; }, error ? 9000 : 3200);
}

function decode(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function load() {
  if (!client) throw new Error('Could not load the Supabase browser library. Reload the page to try again.');
  const version = ++loadVersion;
  const [members,tasks,docs] = await Promise.all([
    client.from('edge_members').select('email,name,role').order('name'),
    client.from('edge_tasks').select().is('archived_at',null).order('created_at'),
    client.from('edge_docs').select().order('created_at',{ascending:false})
  ]);
  if (version !== loadVersion) return;
  Object.assign(state,{members:decode(members),tasks:decode(tasks),docs:decode(docs),error:'',ready:true});
}

function options(values, active) {
  return values.map(value=>`<option value="${html(value)}"${value===active?' selected':''}>${html(value)}</option>`).join('');
}
function peopleOptions(active, empty) {
  return `<option value="">${empty}</option>`+state.members.map(person=>`<option value="${html(person.email)}"${active===person.email?' selected':''}>${html(person.name)}</option>`).join('');
}
function field(label, name, value, attrs = '') {
  return `<label>${label}<input class="field" name="${name}" value="${html(value)}" ${attrs}></label>`;
}
function choice(label, name, items, active) {
  return `<label>${label}<select class="field" name="${name}">${options(items,active)}</select></label>`;
}
function heading(title, actions = '') {
  return `<header class="heading"><h1>${html(title)}</h1>${actions}</header>`;
}
function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}
function person(email) {
  const name=memberName(email);
  return `<span class="person">${email?`<span class="avatar" aria-hidden="true">${html(initials(name))}</span>`:''}<span class="truncated">${html(name)}</span></span>`;
}

function renderAccount(tab) {
  for(const link of document.querySelectorAll('[data-tab]')) {
    if(link.dataset.tab===tab) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  account.textContent = !state.ready ? 'Connecting…' : state.error ? 'Unavailable' : 'Shared board';
}
function renderUnavailable() {
  main.innerHTML=`<section class="panel"><h2>Workspace unavailable</h2>
    <p role="alert">${html(state.error)}</p>
    <button class="btn" data-action="refresh">Retry</button></section>`;
}
function renderCards() {
  const board=document.getElementById('board');
  if (!board) return;
  const search=filter.search.trim().toLowerCase();
  const filtered=state.tasks.filter(task =>
    (!filter.assignee || (filter.assignee==='unassigned' ? !task.assignee_email : task.assignee_email===filter.assignee)) &&
    (!search || [task.title,task.scope,memberName(task.assignee_email)].some(value=>value.toLowerCase().includes(search))));
  board.innerHTML=STATUSES.map(status=>{
    const tasks=filtered.filter(task=>task.status===status);
    return `<section class="lane" data-status="${status}"><header class="lane-head"><span class="dot" aria-hidden="true"></span>
      <h2>${status}</h2><span class="count" aria-label="${tasks.length} tasks">${tasks.length}</span>
      <button class="btn add" data-action="new" data-status="${status}" aria-label="Add task to ${status}">+</button></header>
      ${tasks.length?tasks.map(task=>`<article class="task" data-task-id="${html(task.id)}"><a class="task-link" draggable="false" href="#task/${encodeURIComponent(task.id)}">
       <h3>${html(task.title)}</h3><span class="drag-handle" title="Drag to another column" aria-hidden="true">⠿</span><div class="tags"><span class="tag scope">${html(task.scope)}</span>${task.priority==='Normal'?'':`<span class="tag ${task.priority==='High'?'high':''}">${html(task.priority)}</span>`}</div>
       <div class="task-foot">${person(task.assignee_email)}${task.due_date?`<time datetime="${html(task.due_date)}">${displayDue(task.due_date)}</time>`:''}</div>
      </a>${status==='To Do'?`<button class="btn start-task" data-action="start" data-id="${html(task.id)}">Start task</button>`:''}</article>`).join(''):'<p class="empty">No tasks</p>'}</section>`;
  }).join('');
}
function renderTasks() {
  main.innerHTML=heading('Tasks','<div class="actions"><button class="btn" data-action="members">Members</button><button class="btn primary" data-action="new">+ New task</button></div>')+
    `<div class="toolbar"><input id="task-search" class="field" type="search" aria-label="Search tasks" placeholder="Search tasks" value="${html(filter.search)}">
      <select class="field" id="assignee-filter" aria-label="Filter by assignee" style="width:auto">${peopleOptions(filter.assignee,'All assignees')}<option value="unassigned"${filter.assignee==='unassigned'?' selected':''}>Unassigned</option></select>
      <button class="btn push" data-action="refresh">Refresh</button></div><div id="board" class="board"></div>`;
  renderCards();
}

function renderTask(task, status, version) {
  const value=task || {status:status||'To Do', priority:'Normal',scope:'Shared'};
  const link = (url,label) => safeUrl(url) ? `<a href="${html(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<span class="hint">${label} not added</span>`;
  main.innerHTML=`<a href="#tasks" class="back">Back to Tasks</a>`+heading(task?task.title:'New task')+
    `<div class="ticket-grid"><form class="panel" id="task-form" data-id="${html(task?.id)}" data-revision="${html(task?.revision)}">
    <h2>Task details</h2><div class="form-grid">
    <div class="full">${field('Title','title',value.title,'required maxlength="160"')}</div>
    ${field('App view / scope','scope',value.scope,'required maxlength="100"')}
    ${choice('Priority','priority',PRIORITIES,value.priority)}
    ${choice('Status','status',STATUSES,value.status)}
    <label>Assignee<select name="assignee_email" class="field">${peopleOptions(value.assignee_email,'Unassigned')}</select></label>
    ${field('Due date','due_date',value.due_date,'type="date"')}
    <div></div>
    ${field('Backend URL','backend_url',value.backend_url,'type="url" placeholder="https://…"')}
    ${field('Frontend URL','frontend_url',value.frontend_url,'type="url" placeholder="https://…"')}
    <label class="full">Work details<textarea class="field" name="description">${html(value.description)}</textarea></label>
    <label class="full">Done when<textarea class="field" name="acceptance">${html(value.acceptance)}</textarea></label>
    </div><div class="form-foot">${task?'<button type="button" class="btn archive-task" data-action="archive">Archive task</button>':''}<a class="btn" href="#tasks">Back to board</a><button class="btn primary">${task?'Save changes':'Create task'}</button></div></form>
    <aside class="stack"><section class="panel"><h2>Links</h2><div class="link-list">${link(value.backend_url,'Backend')}${link(value.frontend_url,'Frontend')}</div></section>
    <section class="panel"><h2>History</h2><div id="task-history" class="hint">${task?'Loading history…':'History starts after this task is created.'}</div></section></aside></div>`;
  if (task) renderHistory(task.id,version);
}
async function renderHistory(id,version) {
  const target=document.getElementById('task-history');
  try {
    const items=decode(await client.from('edge_history').select().eq('task_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(100));
    if(version!==activeView) return;
    const describe=(field,value)=>field==='assignee_email'?memberName(value):value || 'Empty';
    target.innerHTML=items.length ? '<ol class="history">'+items.map(item=>{
      const label=FIELD_LABELS[item.field]||item.field;
      const changes=item.field==='created'?'Task created':`${html(label)} · ${html(describe(item.field,item.old_value))} → ${html(describe(item.field,item.new_value))}`;
      return `<li><strong>${changes}</strong><br><time datetime="${html(item.created_at)}">${displayDate(item.created_at)}</time> · ${html(item.actor?memberName(item.actor):'Anonymous edit')}</li>`;
    }).join('')+'</ol>' : 'No changes recorded.';
  } catch(error) {
    if(version===activeView) target.textContent=error.message;
  }
}

function renderDocs() {
  main.innerHTML=heading('Docs','<button class="btn primary" data-action="upload">+ Upload document</button>')+
    `<div class="doc-list">${[BUILTIN_DOC,...state.docs].map(doc=>`<a class="panel doc-card" href="#doc/${encodeURIComponent(doc.id)}">
    <span class="tags"><span class="tag scope">${html(doc.kind.toUpperCase())}</span></span><h2>${html(doc.title)}</h2><span class="hint">${html(doc.file_name)}</span></a>`).join('')}</div>`;
}
function markdown(source) {
  const rows=source.replaceAll('\r','').split('\n');
  let result='', block=[], fenced=false, list='';
  const inline=text=>html(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  const endList=()=>{if(list){result+=`</${list}>`;list='';}};
  for (const row of rows) {
    if (row.startsWith('```')) {
      endList();
      if (fenced) { result+=`<pre>${html(block.join('\n'))}</pre>`;block=[]; }
      fenced=!fenced;
      continue;
    }
    if (fenced) { block.push(row);continue; }
    const item=row.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/);
    if(item) {
      const kind=item[2]?'ol':'ul';
      if(list!==kind){endList();result+=`<${kind}>`;list=kind;}
      result+=`<li>${inline(item[3])}</li>`;continue;
    }
    endList();
    const match=row.match(/^(#{1,6})\s+(.+)$/);
    if(match){const level=Math.min(6,match[1].length+1);result+=`<h${level}>${inline(match[2])}</h${level}>`;}
    else if(row.trim()) result+=`<p>${inline(row)}</p>`;
  }
  endList();
  if(fenced) result+=`<pre>${html(block.join('\n'))}</pre>`;
  return result;
}
async function renderDocument(doc,version) {
  main.innerHTML='<header class="doc-toolbar"><a href="#docs" class="btn">Back to Docs</a></header>';
  main.insertAdjacentHTML('beforeend',doc.builtin?'<iframe class="viewer" title="22 Nov Driver App Release" src="release-handoff.html" sandbox="allow-scripts allow-popups"></iframe>':'<div id="file-view" class="panel">Loading document…</div>');
  if(doc.builtin) return;
  const view=document.getElementById('file-view');
  try {
    const file=decode(await client.storage.from(BUCKET).download(doc.path));
    if (!file) throw new Error('Document content is unavailable.');
    if(version!==activeView) return;
    if(doc.kind==='md' || doc.kind==='html') {
      const text=await file.text();
      if(version!==activeView) return;
      if(doc.kind==='md') view.innerHTML=`<div class="markdown">${markdown(text)}</div>`;
      else {
        const iframe=document.createElement('iframe');
        iframe.className='viewer';
        iframe.title=doc.title;
        iframe.setAttribute('sandbox','');
        iframe.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; base-uri \'none\'; form-action \'none\'">'+text;
        view.replaceWith(iframe);
      }
    }
    if(doc.kind==='pdf') {
      docUrl=URL.createObjectURL(new Blob([file],{type:'application/pdf'}));
      view.outerHTML=`<iframe class="viewer" title="${html(doc.title)}" src="${html(docUrl)}"></iframe>`;
    }
  } catch(error) {
    if(version===activeView) view.textContent=error.message;
  }
}
function render() {
  const version=++activeView;
  if(docUrl){URL.revokeObjectURL(docUrl);docUrl=null;}
  const [page,id]=(location.hash.slice(1)||'tasks').split('/');
  const documentOpen=page==='doc' && !state.error;
  main.classList.toggle('doc-view',documentOpen);
  main.parentElement.classList.toggle('document-open',documentOpen);
  main.classList.toggle('docs-list-view',page==='docs');
  renderAccount(page==='docs' || page==='doc' ? 'docs' : 'tasks');
  if(state.error) {renderUnavailable();return;}
  if(page==='tasks') renderTasks();
  else if(page==='docs') renderDocs();
  else if(page==='new') renderTask(null,STATUSES[Number(id)],version);
  else if(page==='task') {
    const task=state.tasks.find(task=>task.id===id);
    if(task) renderTask(task,null,version);
    else main.innerHTML='<a href="#tasks" class="back">Back to Tasks</a><h1>Task unavailable</h1>';
  } else if(page==='doc') {
    const doc=[BUILTIN_DOC,...state.docs].find(doc=>doc.id===id);
    if(doc) renderDocument(doc,version);
    else main.innerHTML='<a href="#docs" class="back">Back to Docs</a><h1>Document unavailable</h1>';
  } else renderTasks();
}

function openModal(title,body) {
  modal.innerHTML=`<div class="dialog-head"><h2>${title}</h2><button class="btn" data-action="close" aria-label="Close dialog">Close</button></div>`+body;
  if(!modal.open) modal.showModal();
}
function showMembers() {
  openModal('Members',`<ul class="member-list">${state.members.map(member=>`<li><strong>${html(member.name)}</strong></li>`).join('')}</ul>
  <form id="member-form" class="stack">
    ${field('Name','name','','required maxlength="100"')}
    <button class="btn primary">Add member</button>
  </form>`);
}
function uploadModal() {
  openModal('Upload document',`<form id="upload-form" class="stack">
    ${field('Title','title','','maxlength="160" placeholder="Use the file name"')}
    <label>Files<input name="file" class="field" type="file" required accept=".html,.htm,.md,.markdown,.pdf" multiple></label>
    <p class="hint">HTML, Markdown or PDF. Up to 10 MB per file.</p>
    <button class="btn primary">Upload</button></form>`);
}
function taskPayload(form) {
  const data=new FormData(form);
  const payload=Object.fromEntries(FIELDS.map(name=>[name,String(data.get(name)||'').trim()]));
  if(!payload.title || !payload.scope) throw new Error('Enter a title and app view.');
  for(const name of ['backend_url','frontend_url']) {
    if(payload[name] && !safeUrl(payload[name])) throw new Error('Use an HTTP or HTTPS URL without embedded credentials.');
    payload[name]=safeUrl(payload[name])||null;
  }
  for(const name of ['assignee_email','due_date']) payload[name] ||= null;
  return payload;
}
async function updateTask(id, revision, payload) {
  const changed=decode(await client.from('edge_tasks').update(payload).eq('id',id).eq('revision',revision).is('archived_at',null).select());
  if(changed.length!==1) throw new Error('This task changed elsewhere. Refresh before editing.');
  return changed[0];
}
function updateBoardTask(task) {
  loadVersion++;
  const index=state.tasks.findIndex(item=>item.id===task.id);
  if(index===-1) state.tasks.push(task);
  else state.tasks[index]=task;
}
async function saveTask(form) {
  const payload=taskPayload(form);
  const saved=form.dataset.id
    ? await updateTask(form.dataset.id,form.dataset.revision,payload)
    : decode(await client.from('edge_tasks').insert({id:crypto.randomUUID(),...payload}).select().single());
  updateBoardTask(saved);
  if (!form.dataset.id) {filter.search='';filter.assignee='';}
  if(form.isConnected) {
    history.replaceState(null,'','#tasks');
    render();
    main.focus({preventScroll:true});
    window.scrollTo(0,0);
  } else renderCards();
  inform('Task saved.');
  try {await load();renderCards();}
  catch(error) {inform('Task saved. Board refresh failed: '+error.message,true);}
}
async function moveTask(id, status) {
  const task=state.tasks.find(item=>item.id===id);
  if(!task || task.status===status || pendingMoves.has(id)) return;
  pendingMoves.add(id);
  try {
    updateBoardTask(await updateTask(id,task.revision,{status}));
    renderCards();
    inform(`Moved to ${status}.`);
  } finally {
    pendingMoves.delete(id);
  }
}
async function startTask(button) {
  button.disabled=true;
  try {await moveTask(button.dataset.id,'In Progress');}
  finally {button.disabled=false;}
}
async function archiveTask(button) {
  const form=button.closest('form');
  if(!confirm('Archive this task? It will leave the board and its history will be retained.')) return;
  button.disabled=true;
  try {
    await updateTask(form.dataset.id,form.dataset.revision,{archived_at:new Date().toISOString()});
    await load();
    go('#tasks');
    inform('Task archived.');
  } finally {button.disabled=false;}
}
async function addMember(form) {
  const values=new FormData(form);
  const member={name:String(values.get('name')).trim(),email:crypto.randomUUID()+'@roster.invalid',role:'member'};
  if(!member.name) throw new Error('Enter a name.');
  decode(await client.from('edge_members').insert(member));
  await load();
  render();
  showMembers();
  inform('Member added.');
}
async function upload(form) {
  const values=new FormData(form);
  const files=values.getAll('file');
  const title=String(values.get('title')||'').trim();
  const prepared=[];
  for(const file of files) {
    const extension=file.name.split('.').pop().toLowerCase();
    const kind={md:'md',markdown:'md',pdf:'pdf',html:'html',htm:'html'}[extension];
    if(!kind || !file.size || file.size>10485760) throw new Error('Choose HTML, Markdown or PDF files up to 10 MB each.');
    if(kind==='pdf' && !(await file.slice(0,5).text()).startsWith('%PDF-')) throw new Error('The PDF file is invalid.');
    const id=crypto.randomUUID();
    const doc={id,title:(files.length===1&&title||file.name.replace(/\.[^.]+$/,'')||file.name).slice(0,160),
      path:`shared/${id}.${kind}`,kind,file_name:file.name,created_at:new Date().toISOString()};
    prepared.push({file,doc,type:{pdf:'application/pdf',md:'text/markdown',html:'text/html'}[kind]});
  }
  let uploaded=0;
  try {
    for(const {file,doc,type} of prepared) {
      decode(await client.storage.from(BUCKET).upload(doc.path,file,{contentType:type,upsert:false}));
      const result=await client.from('edge_docs').insert(doc);
      if(result.error){
        await client.storage.from(BUCKET).remove([doc.path]);
        decode(result);
      }
      uploaded++;
    }
  } catch(error) {
    if(!uploaded) throw error;
    modal.close();await load();render();
    inform(`${uploaded} uploaded. Remaining files stopped: ${error.message}`,true);
    return;
  }
  modal.close();await load();render();
  inform(uploaded===1?'Document uploaded.':`${uploaded} documents uploaded.`);
}

async function refresh() {
  try { await load(); } catch (error) { state.error=error.message;state.ready=true; }
  render();
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');
  if(!button) return;
  try {
    if(button.dataset.action==='refresh') await refresh();
    else if(button.dataset.action==='new') go('#new/'+Math.max(0,STATUSES.indexOf(button.dataset.status)));
    else if(button.dataset.action==='start') await startTask(button);
    else if(button.dataset.action==='archive') await archiveTask(button);
    else if(button.dataset.action==='members') showMembers();
    else if(button.dataset.action==='upload') uploadModal();
    else if(button.dataset.action==='close') modal.close();
  } catch(error) { inform(error.message,true); }
});
document.addEventListener('submit',async event=>{
  const form=event.target;
  event.preventDefault();
  const button=event.submitter || form.querySelector('button');
  if(button?.disabled) return;
  if(button) button.disabled=true;
  try {
    if(form.id==='task-form') await saveTask(form);
    else if(form.id==='member-form') await addMember(form);
    else if(form.id==='upload-form') await upload(form);
  } catch(error) { inform(error.message,true); }
  finally{ if(button) button.disabled=false; }
});
document.addEventListener('input',event=>{
  if(event.target.id==='task-search'){filter.search=event.target.value;renderCards();}
});
document.addEventListener('change',event=>{
  if(event.target.id==='assignee-filter'){filter.assignee=event.target.value;renderCards();}
});
function markDropLane() {
  const lane=document.elementFromPoint(drag.x,drag.y)?.closest('#board .lane');
  if(lane===drag.lane) return;
  drag.lane?.classList.remove('drop-target');
  drag.lane=lane;
  lane?.classList.add('drop-target');
}
function liftTask(card) {
  const bounds=card.getBoundingClientRect();
  const ghost=card.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.inert=true;
  ghost.setAttribute('aria-hidden','true');
  Object.assign(ghost.style,{left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`});
  document.body.append(ghost);
  return ghost;
}
function positionDragGhost() {
  drag.ghost.style.transform=`translate3d(${drag.x-drag.startX}px,${drag.y-drag.startY}px,0)`;
}
function trackDrag() {
  if(!drag?.started) return;
  const board=drag.card.closest('#board');
  if(!board){finishDrag();return;}
  const bounds=board.getBoundingClientRect();
  if(drag.y>=bounds.top && drag.y<=bounds.bottom && drag.x>=bounds.left && drag.x<=bounds.right) {
    if(drag.x>bounds.right-36) board.scrollLeft+=12;
    else if(drag.x<bounds.left+36) board.scrollLeft-=12;
  }
  positionDragGhost();
  markDropLane();
  drag.frame=requestAnimationFrame(trackDrag);
}
function finishDrag() {
  if(!drag) return;
  const completed=drag;
  drag=null;
  if(completed.frame) cancelAnimationFrame(completed.frame);
  completed.ghost?.remove();
  completed.lane?.classList.remove('drop-target');
  completed.card.classList.remove('is-dragging');
  if(completed.card.hasPointerCapture?.(completed.pointer)) completed.card.releasePointerCapture(completed.pointer);
  return completed;
}
main.addEventListener('dragstart', event => {
  if(event.target.closest('#board .task')) event.preventDefault();
});
main.addEventListener('pointerdown', event => {
  const card=event.target.closest('#board .task');
  if(drag || !card || event.button!==0 || event.target.closest('button') ||
    (event.pointerType==='touch' && !event.target.closest('.drag-handle')) || pendingMoves.has(card.dataset.taskId)) return;
  drag={card,pointer:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};
});
window.addEventListener('pointermove', event => {
  if(drag?.pointer!==event.pointerId) return;
  if(!drag.started) {
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5) return;
    drag.started=true;
    drag.card.setPointerCapture?.(event.pointerId);
    drag.ghost=liftTask(drag.card);
    drag.card.classList.add('is-dragging');
    drag.frame=requestAnimationFrame(trackDrag);
  }
  event.preventDefault();
  drag.x=event.clientX;
  drag.y=event.clientY;
  markDropLane();
},{passive:false});
window.addEventListener('pointercancel', event => {
  if(drag?.pointer===event.pointerId) finishDrag();
});
window.addEventListener('pointerup', async event => {
  if(drag?.pointer!==event.pointerId) return;
  if(drag.started) {
    drag.x=event.clientX;
    drag.y=event.clientY;
    markDropLane();
  }
  const completed=finishDrag();
  if(!completed.started) return;
  suppressCardClick=true;
  setTimeout(()=>{suppressCardClick=false;},0);
  if(!completed.lane) return;
  try {await moveTask(completed.card.dataset.taskId,completed.lane.dataset.status);}
  catch(error) {inform(error.message,true);}
});
main.addEventListener('click',event=>{
  if(suppressCardClick && event.target.closest('.task-link')){
    event.preventDefault();
    event.stopPropagation();
  }
},true);
const workspaceNav = document.getElementById('workspace-nav');
const menuToggle = document.getElementById('menu-toggle');
function setMenu(open) {
  workspaceNav.toggleAttribute('data-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
}
menuToggle.addEventListener('click', () => setMenu(!workspaceNav.hasAttribute('data-open')));
workspaceNav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
window.addEventListener('hashchange',()=>{if(state.ready){render();main.focus({preventScroll:true});window.scrollTo(0,0);}});

refresh();
