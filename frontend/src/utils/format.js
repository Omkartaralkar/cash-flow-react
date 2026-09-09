export const TRANSACTION_TYPES = [
  { value: "income", label: "Income", tone: "positive" },
  { value: "expense", label: "Expense", tone: "negative" },
  { value: "given", label: "Given", tone: "negative" },
  { value: "return", label: "Returned", tone: "positive" },
];

export function typeMeta(type) {
  return (
    TRANSACTION_TYPES.find((t) => t.value === type) || {
      value: type,
      label: type || "—",
      tone: "neutral",
    }
  );
}

export function formatDate(isoDate) {
  if (!isoDate) return "—";

  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function monthLabel(yyyyMm) {
  if (!yyyyMm) return "";
  const [year, month] = yyyyMm.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}
