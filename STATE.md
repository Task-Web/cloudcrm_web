# CloudCRM Workspace State Reference

This document describes the per-user state used by the CloudCRM-style CRM demo. The backend
stores a `UserState` envelope with a free-form `data` object. The frontend reads and writes the
CRM data under `data` so every user cookie sees an isolated workspace.

All timestamps are ISO 8601 strings (UTC).

## State envelope (UserState)
- `meta.created_at` (string): When the state was created.
- `meta.updated_at` (string): Last update time (patch/merge).
- `meta.version` (number): Incremented on each patch/merge.
- `meta.type` (string): Currently `"unrestricted"`.
- `data` (object): CRM workspace data (see below).
- `note` (string or null): Optional human-readable note describing the last change.

When replacing state via `PUT /state`, you may include a `meta` object in the payload to set
the envelope explicitly. If omitted, the backend generates new metadata values.

## Default data shape (data)
- `user` (User): Signed-in user profile and preferences.
- `users` (User[]): Team roster.
- `leads` (Lead[]): Lead records.
- `accounts` (Account[]): Account records.
- `contacts` (Contact[]): Contact records.
- `opportunities` (Opportunity[]): Pipeline deals.
- `cases` (Case[]): Support cases.
- `activities` (Activity[]): Tasks and calendar events.
- `chatterPosts` (ChatterPost[]): Social feed posts.
- `files` (FileItem[]): File metadata shown in the Files app.
- `following` (string[]): User ids followed in chatter.
- `dashboards` (Dashboard[]): Optional dashboard presets.

### User
- `userId` (string)
- `firstName` (string)
- `lastName` (string)
- `email` (string)
- `phone` (string)
- `title` (string)
- `department` (string)
- `role` (string)
- `avatar` (string)
- `timezone` (string)
- `locale` (string)
- `theme` (string)

### Lead
- `leadId` (string)
- `firstName` (string)
- `lastName` (string)
- `company` (string)
- `title` (string)
- `email` (string)
- `phone` (string)
- `mobile` (string)
- `status` (string)
- `source` (string)
- `rating` (string)
- `street` (string)
- `city` (string)
- `state` (string)
- `zip` (string)
- `country` (string)
- `industry` (string)
- `employees` (number)
- `revenue` (number)
- `website` (string)
- `description` (string)
- `ownerId` (string)
- `createdDate` (string)
- `modifiedDate` (string)

### Account
- `accountId` (string)
- `name` (string)
- `phone` (string)
- `website` (string)
- `type` (string)
- `industry` (string)
- `revenue` (number)
- `employees` (number)
- `description` (string)
- `ownerId` (string)
- `billingStreet` (string)
- `billingCity` (string)
- `billingState` (string)
- `billingZip` (string)
- `billingCountry` (string)
- `shippingStreet` (string)
- `shippingCity` (string)
- `shippingState` (string)
- `shippingZip` (string)
- `shippingCountry` (string)
- `createdDate` (string)
- `modifiedDate` (string)

### Contact
- `contactId` (string)
- `accountId` (string)
- `firstName` (string)
- `lastName` (string)
- `title` (string)
- `department` (string)
- `email` (string)
- `phone` (string)
- `mobile` (string)
- `reportsToId` (string, optional)
- `mailingStreet` (string)
- `mailingCity` (string)
- `mailingState` (string)
- `mailingZip` (string)
- `mailingCountry` (string)
- `ownerId` (string)
- `createdDate` (string)
- `modifiedDate` (string)

### Opportunity
- `opportunityId` (string)
- `name` (string)
- `accountId` (string)
- `amount` (number)
- `closeDate` (string)
- `stage` (string)
- `probability` (number)
- `type` (string)
- `leadSource` (string)
- `nextStep` (string)
- `description` (string)
- `ownerId` (string)
- `createdDate` (string)
- `modifiedDate` (string)

### Case
- `caseId` (string)
- `caseNumber` (string)
- `subject` (string)
- `status` (string)
- `priority` (string)
- `origin` (string)
- `accountId` (string)
- `contactId` (string)
- `description` (string)
- `ownerId` (string)
- `createdDate` (string)
- `modifiedDate` (string)
- `closedDate` (string, optional)

### Activity
- `activityId` (string)
- `type` (string) - `"task"` or `"event"`
- `subject` (string)
- `status` (string)
- `priority` (string)
- `dueDate` (string, optional)
- `startDateTime` (string, optional)
- `endDateTime` (string, optional)
- `relatedToType` (string)
- `relatedToId` (string)
- `assignedToId` (string)
- `description` (string)
- `createdDate` (string)
- `location` (string, optional)

### ChatterPost
- `postId` (string)
- `userId` (string)
- `content` (string)
- `createdDate` (string)
- `likeCount` (number)
- `commentCount` (number)
- `likes` (string[])
- `comments` (ChatterComment[])

### ChatterComment
- `commentId` (string)
- `userId` (string)
- `content` (string)
- `createdDate` (string)
- `likeCount` (number)
- `likes` (string[])

### FileItem
- `fileId` (string)
- `name` (string)
- `type` (string)
- `size` (number)
- `url` (string)
- `ownerId` (string)
- `uploadDate` (string)

### Dashboard
- `dashboardId` (string)
- `name` (string)
- `description` (string, optional)
- `chartType` (string)
- `createdDate` (string)
- `createdBy` (string)

## Full example (UserState)
```json
{
  "meta": {
    "created_at": "2024-04-01T12:00:00+00:00",
    "updated_at": "2024-04-01T12:30:00+00:00",
    "version": 2,
    "type": "unrestricted"
  },
  "data": {
    "user": { "userId": "user-1", "firstName": "John", "lastName": "Smith" },
    "leads": [],
    "accounts": [],
    "opportunities": [],
    "files": []
  },
  "note": "Seeded CRM workspace data"
}
```
