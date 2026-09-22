const fs = require('fs');
const filepath = 'src/components/admin/DashboardCards.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const newQuickActions = `
import { 
  Wrench, 
  FolderPlus, 
  LayoutTemplate, 
  FileEdit, 
  Search, 
  ImagePlus, 
  ArrowRightLeft,
  AlertCircle
} from "lucide-react";

export function QuickActions({ role }: { role: string | null | undefined }) {
  const canCreateTool = hasPermission(role, "tools.create");
  const canCreateCategory = hasPermission(role, "categories.create");
  const canEditHomepage = hasPermission(role, "homepage.edit");
  const canEditContent = hasPermission(role, "content.edit");
  const canEditSeo = hasPermission(role, "seo.edit");

  const actions = [
    {
      id: "add-tool",
      label: "Add Tool",
      description: "Create a new tool from scratch.",
      icon: Wrench,
      href: "/admin/tools/new",
      hasPermission: canCreateTool,
      isImplemented: true,
    },
    {
      id: "add-category",
      label: "Add Category",
      description: "Create a new tool category.",
      icon: FolderPlus,
      href: "#",
      hasPermission: canCreateCategory,
      isImplemented: false,
    },
    {
      id: "manage-homepage",
      label: "Manage Homepage",
      description: "Update featured tools and homepage text.",
      icon: LayoutTemplate,
      href: "/admin/content",
      hasPermission: canEditHomepage,
      isImplemented: true,
    },
    {
      id: "create-blog",
      label: "Create Blog",
      description: "Draft a new blog post.",
      icon: FileEdit,
      href: "#",
      hasPermission: canEditContent,
      isImplemented: false,
    },
    {
      id: "manage-seo",
      label: "Manage SEO",
      description: "Update global meta tags and robots.",
      icon: Search,
      href: "/admin/content/seo",
      hasPermission: canEditSeo,
      isImplemented: true,
    },
    {
      id: "upload-media",
      label: "Upload Media",
      description: "Add images to the media library.",
      icon: ImagePlus,
      href: "#",
      hasPermission: canEditContent, // using content.edit since media doesn't have a specific permission
      isImplemented: false,
    },
    {
      id: "create-redirect",
      label: "Create Redirect",
      description: "Add a 301/302 URL redirect.",
      icon: ArrowRightLeft,
      href: "#",
      hasPermission: canEditSeo,
      isImplemented: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {actions.map((action) => {
        if (!action.hasPermission) return null;

        const Icon = action.icon;
        
        if (!action.isImplemented) {
          return (
            <div 
              key={action.id} 
              className="group p-5 bg-zinc-50 border border-zinc-200 rounded-2xl opacity-70 cursor-not-allowed flex flex-col justify-between h-full relative overflow-hidden"
              title="Feature coming soon"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <h3 className="font-semibold text-zinc-700 text-sm">{action.label}</h3>
                <p className="text-xs text-zinc-500 mt-1">{action.description}</p>
              </div>
            </div>
          );
        }

        return (
          <Link 
            key={action.id}
            href={action.href} 
            className="group p-5 bg-white border border-zinc-200 rounded-2xl hover:border-orange-300 hover:shadow-md hover:ring-1 hover:ring-orange-300 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-orange-500 transition-colors">
                  <ArrowRightLeft className="w-3 h-3 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-700 transition-colors">{action.label}</h3>
              <p className="text-xs text-zinc-500 mt-1">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
`;

// Extract imports
let importBlock = content.match(/import.*?from.*?;/g).join('\n');
importBlock = importBlock + '\nimport { Wrench, FolderPlus, LayoutTemplate, FileEdit, Search, ImagePlus, ArrowRightLeft, ArrowUpRight } from "lucide-react";';

// Find the DashboardMetrics block and keep it
const metricsMatch = content.match(/export function DashboardMetrics[\s\S]*?return \([\s\S]*?\}\);?\n\}/);
const metricsBlock = metricsMatch[0];

const newContent = \`\${importBlock}

\${metricsBlock}

\${newQuickActions.replace(/import.*?lucide-react";/s, '')}\`;

fs.writeFileSync(filepath, newContent);
