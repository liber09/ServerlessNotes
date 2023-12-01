# serverlessNotes

## Endpoints

|  Endpoint |  Method |  Description |
|---|---|---|
| `/api/user/signup` | `POST` | Create account |
| `/api/user/login` | `POST` | Login |
| `/api/notes` | `POST` | Post a note |
| `/api/notes` | `GET` | Get all notes for signed in user|
| `/api/notes` | `PUT` | Update note |
| `/api/notes/` | `DELETE` | Mark note for delete |
| `/api/notes/archive` | `PATCH` | Archive note |
| `/api/trash` | `PATCH` | Restore note from trash |
| `/api/trash` | `GET` | Get trashed notes for signed in user |
