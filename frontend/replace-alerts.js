const fs = require('fs');
const path = require('path');

const dir = 'c:/PrestamosVGI/frontend/app';

function walkDir(d, callback) {
    fs.readdirSync(d).forEach(f => {
        let dirPath = path.join(d, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(d, f));
    });
}

walkDir(dir, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('alert(')) {
            // Replace alert( with toast.error( for errors, and toast.success for success
            // To make it simple, we can replace all alert( with toast( 
            // BUT wait, we need to add the import statement!
            if (!content.includes("import toast from 'react-hot-toast'") && !content.includes("import { toast } from 'react-hot-toast'")) {
                // inject import after the first import or at the top
                const lines = content.split('\n');
                const importIndex = lines.findIndex(l => l.startsWith('import '));
                if (importIndex !== -1) {
                    lines.splice(importIndex, 0, "import { toast } from 'react-hot-toast';");
                } else {
                    lines.unshift("import { toast } from 'react-hot-toast';");
                }
                content = lines.join('\n');
            }
            
            // basic replacement logic for alert -> toast.error / toast.success
            content = content.replace(/alert\((.*(?:éxito|exitosamente|correctamente).*)\)/gi, 'toast.success($1)');
            content = content.replace(/alert\(/g, 'toast.error('); // all remaining are errors or warnings

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
