export const NOTIFICATION_EVENTS = {
  NEW_USER: "NEW_USER",
  NEW_PAYMENT: "NEW_PAYMENT",
  FAILED_PAYMENT: "FAILED_PAYMENT",
  TOOL_ERROR: "TOOL_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  NEW_FEEDBACK: "NEW_FEEDBACK",
  NEW_CONTACT_REQUEST: "NEW_CONTACT_REQUEST",
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
  BACKUP_FAILURE: "BACKUP_FAILURE",
} as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS] | string;

export interface NotificationEventDefinition {
  type: NotificationEventType;
  label: string;
  description: string;
  defaultSeverity: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CRITICAL";
  requiredPermission: string;
  eligibleRoleSlugs: string[];
}

export const NOTIFICATION_EVENT_REGISTRY: Record<string, NotificationEventDefinition> = {
  NEW_USER: {
    type: "NEW_USER",
    label: "New User Registration",
    description: "Triggered when a new user signs up or is provisioned.",
    defaultSeverity: "INFO",
    requiredPermission: "users.view",
    eligibleRoleSlugs: ["super_admin", "admin"],
  },
  NEW_PAYMENT: {
    type: "NEW_PAYMENT",
    label: "Successful Payment",
    description: "Triggered when a payment or subscription billing succeeds.",
    defaultSeverity: "SUCCESS",
    requiredPermission: "payments.view",
    eligibleRoleSlugs: ["super_admin", "admin", "finance"],
  },
  FAILED_PAYMENT: {
    type: "FAILED_PAYMENT",
    label: "Failed Payment",
    description: "Triggered when a subscription charge or transaction fails.",
    defaultSeverity: "ERROR",
    requiredPermission: "payments.view",
    eligibleRoleSlugs: ["super_admin", "admin", "finance"],
  },
  TOOL_ERROR: {
    type: "TOOL_ERROR",
    label: "Tool Execution Failure",
    description: "Triggered when a tool experiences runtime or execution errors.",
    defaultSeverity: "WARNING",
    requiredPermission: "errors.view",
    eligibleRoleSlugs: ["super_admin", "admin", "support"],
  },
  SERVER_ERROR: {
    type: "SERVER_ERROR",
    label: "Critical Server Error",
    description: "Triggered for unhandled application crashes or backend exceptions.",
    defaultSeverity: "CRITICAL",
    requiredPermission: "errors.view",
    eligibleRoleSlugs: ["super_admin", "admin"],
  },
  NEW_FEEDBACK: {
    type: "NEW_FEEDBACK",
    label: "New User Feedback",
    description: "Triggered when user feedback or review submission arrives.",
    defaultSeverity: "INFO",
    requiredPermission: "feedback.view",
    eligibleRoleSlugs: ["super_admin", "admin", "support"],
  },
  NEW_CONTACT_REQUEST: {
    type: "NEW_CONTACT_REQUEST",
    label: "New Contact Form Request",
    description: "Triggered when a contact or support form is submitted.",
    defaultSeverity: "INFO",
    requiredPermission: "feedback.view",
    eligibleRoleSlugs: ["super_admin", "admin", "support"],
  },
  SUBSCRIPTION_CANCELLED: {
    type: "SUBSCRIPTION_CANCELLED",
    label: "Subscription Cancelled",
    description: "Triggered when a user cancels their paid plan subscription.",
    defaultSeverity: "WARNING",
    requiredPermission: "subscriptions.view",
    eligibleRoleSlugs: ["super_admin", "admin", "finance"],
  },
  BACKUP_FAILURE: {
    type: "BACKUP_FAILURE",
    label: "Backup Failure",
    description: "Triggered when a automated or manual system backup fails.",
    defaultSeverity: "CRITICAL",
    requiredPermission: "settings.manage",
    eligibleRoleSlugs: ["super_admin"],
  },
};
