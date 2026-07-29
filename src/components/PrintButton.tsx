import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  title: string;
  contentId?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

/**
 * Generic print button that prints a section of the page or the entire page.
 * Pass `contentId` to print a specific element by ID, otherwise prints the whole page.
 */
export function PrintButton({ title, contentId, variant = "outline", size = "sm", className = "", label }: PrintButtonProps) {
  const handlePrint = () => {
    if (contentId) {
      const el = document.getElementById(contentId);
      if (!el) return;
      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) return;
      win.document.write(`
        <html><head><title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
          h1 { font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0; }
          th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; }
          td { padding: 6px 8px; border: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; }
          @media print { body { padding: 15px; } }
        </style></head><body>
        <h1>${title}</h1>
        ${el.innerHTML}
        <div class="footer">
          <p>Printed on ${new Date().toLocaleString()} | Powered by Brightcare</p>
        </div>
        <script>window.print();<\/script>
        </body></html>
      `);
      win.document.close();
    } else {
      window.print();
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handlePrint} className={className}>
      <Printer className="h-4 w-4 mr-1" />
      {label || "Print"}
    </Button>
  );
}
