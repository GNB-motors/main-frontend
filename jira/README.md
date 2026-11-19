# GNB Edge

Static Tasks and Docs workspace. Opening the page takes you straight to the board. Team members are assignment names.

## Open the app

Open `index.html` or serve the static folder over localhost. Both use the same Supabase workspace.

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory jira
```

Open `http://127.0.0.1:8765/`. Tasks, members, history and uploads are read from Supabase. If the connection fails, the app shows an error and a Retry button.

## Shared board

Run [supabase.sql](supabase.sql) in the intended project's SQL Editor, then publish the static files. The page reads and writes directly through the supplied Supabase publishable key. Refresh to pick up other people's edits. The setup creates an empty board and does not seed tasks or members.

Use **New task** to create a card. Grab a card or its drag handle and drop it into another column to change status, or use **Start task** to move a card directly from To Do to In Progress. Saving a new or edited task reloads the board. **Archive task** removes it from the board and retains its history.

The SQL enables public reads and writes on the workspace tables and document storage paths. Anyone can use the shared board and its APIs. Use only data and files you are comfortable making public. Assignment history records the previous and new assignee and timestamp. The person making an edit appears as anonymous.

The SQL is a setup file and can be left out of the public folder.
