import fs from "fs";
import path from "path";

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (/\.tsx?$/.test(file) && !full.includes("nextauth")) {
      let content = fs.readFileSync(full, "utf8");
      if (
        content.includes("from '@/auth'") ||
        content.includes('from "@/auth"')
      ) {
        content = content.replace(
          /import \{ auth \} from '@\/auth';?/g,
          "import { getSession } from '@/lib/get-session';",
        );
        content = content.replace(
          /import \{ auth \} from "@\/auth";?/g,
          'import { getSession } from "@/lib/get-session";',
        );
        content = content.replace(/await auth\(\)/g, "await getSession()");
        fs.writeFileSync(full, content);
        console.log("updated", full);
      }
    }
  }
}

walk("apps/web/app/api");
