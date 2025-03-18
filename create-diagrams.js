const fs = require('fs');
const { createCanvas } = require('canvas');

// Ensure the images directory exists
if (!fs.existsSync('./images')) {
  fs.mkdirSync('./images');
}

// System Calls Diagram
const systemCallsDiagram = `+------------------+     +------------------+
|   User Space     |     |                  |
|   +----------+   |     |   +----------+   |
|   |Application|  |     |   |Application|  |
|   |Process A  |  |     |   |Process B  |  |
|   +----------+   |     |   +----------+   |
|        |         |     |        |         |
+--------|---------|-----+--------|---------|
         |                        |
         v                        v
+--------------------------------------------+
|         System Calls Interface             |
+--------------------------------------------+
                   |
                   v
+--------------------------------------------+
|                Kernel Space                |
|   +------------+                           |
|   |System Call |                           |
|   |Handler     |                           |
|   +------------+                           |
|         |                                  |
|         v                                  |
|   +---------------------------+            |
|   |Kernel Services & Functions|            |
|   |  +--------------+        |            |
|   |  |Process       |        |            |
|   |  |Management    |        |            |
|   |  +--------------+        |            |
|   |  +--------------+        |            |
|   |  |Memory        |        |            |
|   |  |Management    |        |            |
|   |  +--------------+        |            |
|   |  +--------------+        |            |
|   |  |File System   |        |            |
|   |  +--------------+        |            |
|   |  +--------------+        |            |
|   |  |Device Drivers|        |            |
|   |  +--------------+        |            |
|   |  +--------------+        |            |
|   |  |Network Stack |        |            |
|   |  +--------------+        |            |
|   +---------------------------+            |
+--------------------------------------------+
          |       |       |       |
          v       v       v       v
+--------------------------------------------+
|                Hardware                    |
|  +-----+  +------+  +-----+  +-------+    |
|  | CPU |  |Memory|  |Disks|  |Network|    |
|  +-----+  +------+  +-----+  +-------+    |
+--------------------------------------------+`;

// Process Scheduling Diagram
const processSchedulingDiagram = ` +------------+
 | Created/New|
 +------------+
        |
        | admitted
        v
  +------------+             +------------+
  |   Ready    |<------------|   Waiting  |
  +------------+    I/O or   +------------+
        |          event           ^
        | dispatch  complete       |
        |                          | I/O or
        v                          | event wait
  +------------+             |     |
  |  Running   |-------------+     |
  +------------+                   |
        |                          |
        | exit                     |
        v                          |
  +------------+                   |
  | Terminated |                   |
  +------------+                   |
        
        +---------------+          |
        |  CPU Scheduler|----------+
        |  +-----------+|   time slice
        |  |Dispatcher |<----expired---+
        |  +-----------+|              |
        +---------------+              |
               |                       |
               | context switch        |
               v                       |
        +---------------+              |
        |  Process      |--------------+
        +---------------+
          
  Scheduling Algorithms:
  - FCFS (First-Come, First-Served)
  - SJF (Shortest Job First)
  - Priority Scheduling  
  - Round Robin
  - Multilevel Feedback Queue`;

function createDiagramPNG(text, outputPath) {
  // Split the text into lines
  const lines = text.split('\n');
  
  // Calculate dimensions (8px per character width, 16px line height)
  const maxWidth = Math.max(...lines.map(line => line.length)) * 8;
  const height = lines.length * 16;
  
  // Create a canvas
  const canvas = createCanvas(maxWidth + 40, height + 40);
  const ctx = canvas.getContext('2d');
  
  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  ctx.font = '14px monospace';
  ctx.fillStyle = 'black';
  
  // Draw each line of text
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 20, 20 + (i * 16));
  }
  
  // Write to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Created ${outputPath}`);
}

// Create the diagrams
createDiagramPNG(systemCallsDiagram, './images/system-calls-diagram.png');
createDiagramPNG(processSchedulingDiagram, './images/process-scheduling.png');

console.log('Done creating diagrams!'); 