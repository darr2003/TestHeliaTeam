export interface Column<T> {
  key: string;
  header: string;
  numeric?: boolean;
  render: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  totalRow?: Record<string, React.ReactNode>;
  emptyMessage?: string;
  compact?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  totalRow,
  emptyMessage = "Sin datos.",
  compact,
  onRowClick,
  rowClassName,
}: TableProps<T>) {
  return (
    <div className="ah-table-wrap">
      <table className={`ah-table${compact ? " ah-table-compact" : ""}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.numeric ? "num" : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="muted"
                style={{ textAlign: "center" }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className={rowClassName?.(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.numeric ? "num" : undefined}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {totalRow && data.length > 0 && (
            <tr className="is-total">
              {columns.map((col) => (
                <td key={col.key} className={col.numeric ? "num" : undefined}>
                  {totalRow[col.key] ?? ""}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
