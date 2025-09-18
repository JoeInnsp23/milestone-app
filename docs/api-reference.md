# API Reference

## Project Estimates Server Actions

The application uses Next.js Server Actions for all estimates CRUD operations. These actions are secure, type-safe, and automatically handle authentication.

### Create Estimate

**Action**: `createEstimate(formData: FormData)`

Creates a new estimate for a project.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `description` | string | Yes | Description of the estimate (max 500 chars) |
| `estimate_type` | enum | Yes | One of: 'revenue', 'cost', 'hours', 'materials' |
| `amount` | number | Yes | Numeric amount (must be positive) |
| `estimate_date` | string | Yes | Date in ISO format (YYYY-MM-DD) |
| `confidence_level` | number | No | Confidence level from 1-5 (default: 3) |
| `notes` | string | No | Additional notes |

#### Response

```typescript
{
  success: boolean;
  estimate?: ProjectEstimate;
  error?: string;
}
```

#### Example Usage

```typescript
const formData = new FormData();
formData.append('project_id', 'uuid-here');
formData.append('description', 'Phase 1 Revenue');
formData.append('estimate_type', 'revenue');
formData.append('amount', '10000');
formData.append('estimate_date', '2024-01-01');
formData.append('confidence_level', '4');

const result = await createEstimate(formData);
if (result.success) {
  console.log('Created estimate:', result.estimate);
}
```

### Update Estimate

**Action**: `updateEstimate(id: string, formData: FormData)`

Updates an existing estimate.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | UUID of the estimate to update |
| `description` | string | Yes | Updated description |
| `estimate_type` | enum | Yes | Updated type |
| `amount` | number | Yes | Updated amount |
| `estimate_date` | string | Yes | Updated date |
| `confidence_level` | number | No | Updated confidence level |
| `notes` | string | No | Updated notes |

#### Response

```typescript
{
  success: boolean;
  estimate?: ProjectEstimate;
  error?: string;
}
```

### Delete Estimate

**Action**: `deleteEstimate(id: string)`

Soft deletes an estimate by setting valid_until timestamp.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | UUID of the estimate to delete |

#### Response

```typescript
{
  success: boolean;
  error?: string;
}
```

#### Example Usage

```typescript
const result = await deleteEstimate('estimate-uuid');
if (result.success) {
  console.log('Estimate deleted');
}
```

## Error Codes

All actions return standardized error messages:

| Error Code | Description |
|------------|-------------|
| `UNAUTHORIZED` | User not authenticated |
| `FORBIDDEN` | User doesn't own the estimate |
| `NOT_FOUND` | Estimate or project not found |
| `VALIDATION_ERROR` | Input validation failed |
| `DATABASE_ERROR` | Database operation failed |

## Authentication

All actions automatically verify the user through Clerk authentication. The `created_by` field is automatically set to the authenticated user's ID.

## Data Validation

Input validation is handled using Zod schemas:

```typescript
const EstimateSchema = z.object({
  project_id: z.string().uuid(),
  description: z.string().min(1).max(500),
  estimate_type: z.enum(['revenue', 'cost', 'hours', 'materials']),
  amount: z.number().positive(),
  estimate_date: z.string(),
  confidence_level: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});
```

## Rate Limiting

Currently no rate limiting is implemented. In production, consider adding:
- Max 100 requests per minute per user
- Max 10 concurrent operations per user

## Versioning

The estimates table supports versioning through:
- `version` field (auto-incremented)
- `previous_version_id` for tracking history

## Soft Delete Pattern

Estimates use soft delete:
- Active records have `valid_until = null`
- Deleted records have `valid_until = timestamp`
- Queries filter by `valid_until IS NULL`