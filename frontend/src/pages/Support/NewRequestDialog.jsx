import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import EntityPicker from '../../components/Erp/EntityPicker';
import AttachmentPicker from '../../components/support/AttachmentPicker';
import SupportField from '../../components/support/SupportField';
import SupportSelect from '../../components/support/SupportSelect';
import { useMutation } from '../../hooks/useMutation';
import { label } from '../../lib/vocabulary';
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, buildTicketForm } from '../../lib/supportTicket';
import { getUserEmail, getUserName } from '../../utils/session';
import { SupportService } from './SupportService';

const CATEGORY_OPTIONS = SUPPORT_CATEGORIES.map((c) => ({
  value: c,
  label: label('supportCategory', c),
}));
const PRIORITY_OPTIONS = SUPPORT_PRIORITIES.map((p) => ({
  value: p,
  label: label('supportPriority', p),
}));

function validate(values) {
  const errors = {};
  const subject = values.subject.trim();
  const description = values.description.trim();
  if (subject.length < 5) errors.subject = 'Give the request a subject of at least 5 characters.';
  if (!values.category) errors.category = 'Pick what this is about.';
  if (description.length < 10)
    errors.description = 'Describe the problem in at least 10 characters.';
  return errors;
}

/**
 * "Submit a request" — nested inside the Support Portal. Requester details come
 * from the session and are read-only; the page the user was on is attached as
 * context so support doesn't have to ask.
 */
export default function NewRequestDialog({ initialSubject = '', onClose, onCreated }) {
  const [values, setValues] = useState({
    subject: initialSubject,
    category: '',
    priority: 'MEDIUM',
    vehicleId: '',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const creating = useMutation((form, { signal }) => SupportService.create(form, { signal }));

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      const ticket = await creating.mutate(
        buildTicketForm(values, files, {
          pageUrl: window.location.pathname + window.location.search,
          userAgent: navigator.userAgent,
        }),
      );
      if (ticket) onCreated(ticket);
    } catch {
      // creating.error renders in the footer; the form keeps its values.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent forceBackdrop className="max-h-[92dvh] overflow-y-auto sm:max-w-[620px]">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Submit a request</DialogTitle>
            <DialogDescription>
              Tell us what went wrong. Our team replies here, in the Support Portal.
            </DialogDescription>
          </DialogHeader>

          <div className="sp-form">
            <div className="sp-form-row">
              <SupportField label="Requester name" htmlFor="sp-requester-name">
                <Input id="sp-requester-name" value={getUserName() || '—'} readOnly disabled />
              </SupportField>
              <SupportField label="Email address" htmlFor="sp-requester-email">
                <Input id="sp-requester-email" value={getUserEmail() || '—'} readOnly disabled />
              </SupportField>
            </div>

            <SupportField label="Subject" required htmlFor="sp-subject" error={errors.subject}>
              <Input
                id="sp-subject"
                value={values.subject}
                onChange={(e) => set('subject')(e.target.value.slice(0, 150))}
                placeholder="e.g. Fuel entry won't save for MH12AB1234"
                aria-invalid={Boolean(errors.subject) || undefined}
              />
            </SupportField>

            <div className="sp-form-row">
              <SupportField label="Category" required error={errors.category}>
                <SupportSelect
                  value={values.category}
                  onChange={set('category')}
                  options={CATEGORY_OPTIONS}
                  ariaLabel="Category"
                  placeholder="What is this about?"
                  className="w-full"
                  invalid={Boolean(errors.category)}
                />
              </SupportField>
              <SupportField label="Priority">
                <SupportSelect
                  value={values.priority}
                  onChange={(v) => set('priority')(v || 'MEDIUM')}
                  options={PRIORITY_OPTIONS}
                  ariaLabel="Priority"
                  className="w-full"
                />
              </SupportField>
            </div>

            <SupportField label="Vehicle (optional)">
              <div className="sp-vehicle-picker">
                <EntityPicker
                  type="VEHICLE"
                  value={values.vehicleId}
                  onChange={(id) => set('vehicleId')(id || '')}
                  placeholder="Search by registration number"
                />
              </div>
            </SupportField>

            <SupportField
              label="Description"
              required
              htmlFor="sp-description"
              error={errors.description}
            >
              <Textarea
                id="sp-description"
                value={values.description}
                onChange={(e) => set('description')(e.target.value.slice(0, 5000))}
                placeholder="Include the steps you took, the page, the vehicle, and any trip or bill numbers."
                rows={5}
                aria-invalid={Boolean(errors.description) || undefined}
              />
            </SupportField>

            <SupportField label="Attachments">
              <AttachmentPicker files={files} onChange={setFiles} disabled={creating.loading} />
            </SupportField>
          </div>

          <DialogFooter className="items-center">
            {creating.error ? (
              <p className="sp-field-errors mr-auto" role="alert">
                {creating.error.displayMessage || 'Could not submit the request. Try again.'}
              </p>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose} disabled={creating.loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating.loading}>
              {creating.loading ? 'Submitting…' : 'Submit request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
