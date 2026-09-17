// Demo data used until the frontend is connected to the backend API.
const assets = [
  {
    name: "api.acme.com",
    type: "Subdomain",
    ip: "104.21.44.18",
    port: "443, 80",
    tech: "Nginx, React",
    risk: "High",
    status: "Active"
  },
  {
    name: "staging.acme.com",
    type: "Subdomain",
    ip: "172.67.12.90",
    port: "443",
    tech: "Nginx, Node.js",
    risk: "Critical",
    status: "Active"
  },
  {
    name: "acme.com",
    type: "Root domain",
    ip: "104.21.44.18",
    port: "443",
    tech: "Cloudflare",
    risk: "Low",
    status: "Active"
  },
  {
    name: "vpn.acme.com",
    type: "Subdomain",
    ip: "198.51.100.24",
    port: "22, 443",
    tech: "OpenSSH, Nginx",
    risk: "Medium",
    status: "Active"
  },
  {
    name: "203.0.113.42",
    type: "IP address",
    ip: "203.0.113.42",
    port: "21, 22, 8080",
    tech: "Apache",
    risk: "Critical",
    status: "Active"
  }
];

const discoveryPoints = [
  42, 58, 51, 74, 67, 82, 73, 94, 78, 89, 108, 96, 122, 104, 116
];

const discoveryDates = [
  "Aug 18", "Aug 20", "Aug 22", "Aug 24", "Aug 26",
  "Aug 28", "Aug 30", "Sep 01", "Sep 03", "Sep 05",
  "Sep 07", "Sep 09", "Sep 11", "Sep 13", "Sep 16"
];
