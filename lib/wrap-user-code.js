/**
 * Wraps user solution code so Judge0 can execute it against stdin test inputs.
 */

function parseLeetCodeStyleInput(stdin) {
  const parsed = {};
  const patterns = [
    { key: "nums", regex: /nums\s*=\s*(\[[^\]]*\])/ },
    { key: "target", regex: /target\s*=\s*(-?\d+)/ },
    { key: "n", regex: /\bn\s*=\s*(-?\d+)/ },
    { key: "s", regex: /\bs\s*=\s*(.+)/ },
  ];

  for (const { key, regex } of patterns) {
    const match = stdin.match(regex);
    if (match) {
      parsed[key] = match[1].trim();
    }
  }

  return parsed;
}

function getFunctionInfo(code) {
  const jsMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
  if (jsMatch) {
    const params = jsMatch[2]
      .split(",")
      .map((p) => p.trim().split(/[:\s]/)[0].replace(/[{}[\]]/g, ""))
      .filter(Boolean);
    return { name: jsMatch[1], params };
  }

  const pyMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);
  if (pyMatch) {
    const params = pyMatch[2]
      .split(",")
      .map((p) => p.trim().split(":")[0].replace("self", "").trim())
      .filter(Boolean);
    return { name: pyMatch[1], params };
  }

  return null;
}

function hasJavaScriptRunner(code) {
  return (
    /require\s*\(\s*['"]readline['"]\s*\)/.test(code) ||
    (/console\.log\s*\(/.test(code) && /rl\.on\s*\(\s*['"]line['"]/.test(code))
  );
}

export function wrapUserCode(sourceCode, languageId, stdin) {
  if (!sourceCode?.trim()) {
    return sourceCode;
  }

  switch (languageId) {
    case 63:
      return wrapJavaScript(sourceCode, stdin);
    case 71:
      return wrapPython(sourceCode, stdin);
    case 62:
      return wrapJava(sourceCode, stdin);
    default:
      return sourceCode;
  }
}

function wrapJavaScript(code, stdin) {
  if (hasJavaScriptRunner(code)) {
    return code;
  }

  const fn = getFunctionInfo(code);
  if (!fn) {
    return code;
  }

  const parsed = parseLeetCodeStyleInput(stdin);

  if (parsed.nums && parsed.target && fn.params.includes("nums") && fn.params.includes("target")) {
    return `${code}

const nums = ${parsed.nums};
const target = ${parsed.target};
console.log(JSON.stringify(${fn.name}(nums, target)));
`;
  }

  if (parsed.n && fn.params.length === 1 && (fn.params[0] === "n" || fn.params.includes("n"))) {
    return `${code}

const n = ${parsed.n};
console.log(String(${fn.name}(n)));
`;
  }

  if (parsed.s && fn.params.length === 1) {
    return `${code}

const result = ${fn.name}(${parsed.s});
console.log(typeof result === "boolean" ? String(result).toLowerCase() : JSON.stringify(result) ?? result);
`;
  }

  if (!stdin.includes("=")) {
    const escaped = stdin.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${code}

const result = ${fn.name}("${escaped}");
console.log(typeof result === "boolean" ? String(result).toLowerCase() : JSON.stringify(result) ?? result);
`;
  }

  return `${code}

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
rl.on("line", (line) => {
  const result = ${fn.name}(line);
  console.log(typeof result === "boolean" ? String(result).toLowerCase() : JSON.stringify(result) ?? result);
  rl.close();
});
`;
}

function wrapPython(code, stdin) {
  if (/if __name__\s*==\s*['"]__main__['"]/.test(code)) {
    return code;
  }

  const fn = getFunctionInfo(code);
  const parsed = parseLeetCodeStyleInput(stdin);

  if (fn && parsed.nums && parsed.target) {
    return `${code}

import json
nums = ${parsed.nums}
target = int(${parsed.target})
result = ${fn.name}(nums, target)
print(json.dumps(result) if isinstance(result, list) else result)
`;
  }

  if (fn && parsed.n) {
    return `${code}

import json
n = int(${parsed.n})
result = ${fn.name}(n)
print(result)
`;
  }

  if (fn && parsed.s) {
    return `${code}

result = ${fn.name}(${parsed.s})
print(str(result).lower() if isinstance(result, bool) else (json.dumps(result) if isinstance(result, list) else result))
`;
  }

  if (fn && !stdin.includes("=")) {
    const escaped = stdin.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${code}

import json
result = ${fn.name}("${escaped}")
print(str(result).lower() if isinstance(result, bool) else (json.dumps(result) if isinstance(result, list) else result))
`;
  }

  return `${code}

import sys
import json
${fn ? `result = ${fn.name}(sys.stdin.readline().strip())` : "pass"}
${fn ? 'print(str(result).lower() if isinstance(result, bool) else (json.dumps(result) if isinstance(result, list) else result))' : ""}
`;
}

function wrapJava(code, stdin) {
  if (/public static void main/.test(code)) {
    return code;
  }
  return code;
}
