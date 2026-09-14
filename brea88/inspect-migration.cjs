const fs = require("fs");

const file = "prisma/migrations/20260902170000_allow_direct_agent_inquiries/migration.sql";
const data = fs.readFileSync(file);

const nullPositions = [];

for (let i = 0; i < data.length; i++) {
  if (data[i] === 0) {
    nullPositions.push(i);
  }
}

console.log("File size:", data.length, "bytes");
console.log("NUL byte count:", nullPositions.length);
console.log("NUL positions:", nullPositions);
console.log("First bytes:", data.subarray(0, 80).toString("hex"));
console.log("Text:");
console.log(data.toString("utf8"));
