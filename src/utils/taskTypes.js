// Maps the backend task_type (the old endpoint name, minus the leading slash)
// to a human-readable label shown in the Task History table.
const TASK_TYPE_LABELS = {
  'core-creation': 'Core Category Creation',
  'channel-creation': 'Channel Category Creation',
  'core-attribute-creation': 'Core Attribute Creation',
  'channel-attribute-creation': 'Channel Attribute Creation',
  'core-reference-data-creation': 'Core LOV Creation',
  'channel-reference-data-creation': 'Channel LOV Creation',
  'core-tenant-cat-mapping': 'Tenant → Core Category Mapping',
  'core-channel-cat-mapping': 'Core → Channel Category Mapping',
  'core-tenant-attribute-mapping': 'Tenant → Core Attribute Mapping',
  'core-channel-attribute-mapping': 'Core → Channel Attribute Mapping',
  'core-tenant-lov-mapping': 'Tenant → Core LOV Mapping',
  'core-channel-lov-mapping': 'Core → Channel LOV Mapping',
};

// Falls back to a title-cased version of the raw key for any unknown task_type.
export const humanizeTaskType = (taskType) => {
  if (!taskType) return 'Unknown Task';
  if (TASK_TYPE_LABELS[taskType]) return TASK_TYPE_LABELS[taskType];
  return taskType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
