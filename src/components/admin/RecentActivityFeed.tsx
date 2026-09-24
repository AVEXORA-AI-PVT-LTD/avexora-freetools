"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  UserPlus, Wrench, FileText, CreditCard, 
  MessageSquare, ShieldAlert, AlertTriangle 
} from "lucide-react";
import Link from "next/link";
import { ActivityItem, ActivityType } from "@/server/admin/activity-service";

interface Props {
  activities: ActivityItem[];
}

const icons: Record<ActivityType, React.ElementType> = {
  USER_CREATED: UserPlus,
  TOOL_UPDATED: Wrench,
  CONTENT_PUBLISHED: FileText,
  PAYMENT_RECEIVED: CreditCard,
  FEEDBACK_RECEIVED: MessageSquare,
  ADMIN_ACTION: ShieldAlert,
  ERROR_OCCURRED: AlertTriangle,
};

const colors: Record<ActivityType, string> = {
  USER_CREATED: "text-blue-600 bg-blue-50 border-blue-200",
  TOOL_UPDATED: "text-purple-600 bg-purple-50 border-purple-200",
  CONTENT_PUBLISHED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  PAYMENT_RECEIVED: "text-green-600 bg-green-50 border-green-200",
  FEEDBACK_RECEIVED: "text-amber-600 bg-amber-50 border-amber-200",
  ADMIN_ACTION: "text-zinc-600 bg-zinc-100 border-zinc-200",
  ERROR_OCCURRED: "text-rose-600 bg-rose-50 border-rose-200",
};

export function RecentActivityFeed({ activities }: Props) {
  const [filter, setFilter] = useState<ActivityType | "ALL">("ALL");

  const filteredActivities = filter === "ALL" 
    ? activities 
    : activities.filter(a => a.type === filter);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Recent Activity</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Real-time overview of platform events</p>
        </div>
        <select 
          className="text-sm border-zinc-200 rounded-lg py-1.5 px-3 bg-zinc-50 text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
          value={filter}
          onChange={(e) => setFilter(e.target.value as ActivityType | "ALL")}
        >
          <option value="ALL">All Activity</option>
          <option value="USER_CREATED">Users</option>
          <option value="TOOL_UPDATED">Tools</option>
          <option value="CONTENT_PUBLISHED">Content</option>
          <option value="PAYMENT_RECEIVED">Payments</option>
          <option value="ERROR_OCCURRED">Errors</option>
          <option value="ADMIN_ACTION">Admin Actions</option>
        </select>
      </div>

      <div className="p-6 flex-1 overflow-y-auto max-h-[500px]">
        {filteredActivities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-zinc-500 font-medium">No recent activity</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">
              Activity will appear here as events occur across the platform.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((activity) => {
              const Icon = icons[activity.type] || ShieldAlert;
              const colorClass = colors[activity.type] || colors.ADMIN_ACTION;
              const timeString = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

              const ContentWrapper = activity.href ? Link : 'div';
              
              return (
                <div key={activity.id} className="relative pl-4">
                  {/* Vertical Line */}
                  <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-zinc-200 last:hidden" />
                  
                  <ContentWrapper 
                    href={activity.href || "#"} 
                    className={`flex items-start gap-4 group ${activity.href ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`relative z-10 w-8 h-8 rounded-full border shrink-0 flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0 bg-white group-hover:bg-zinc-50 transition-colors rounded-xl px-3 -ml-3 -mt-2 pt-2 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {activity.title}
                        </p>
                        <span suppressHydrationWarning className="text-[11px] text-zinc-400 font-medium whitespace-nowrap shrink-0">
                          {timeString}
                        </span>
                      </div>
                      
                      <p className="text-sm text-zinc-600 mt-0.5 truncate">
                        {activity.description}
                      </p>
                      
                      {activity.actor && (
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                          By: <span className="text-zinc-700">{activity.actor}</span>
                        </p>
                      )}
                    </div>
                  </ContentWrapper>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50/50">
        <Link 
          href="/admin/audit-logs" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center w-full"
        >
          View All Activity &rarr;
        </Link>
      </div>
    </div>
  );
}
