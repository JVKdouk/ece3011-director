import fs from 'fs';

/**
 * Reads and parses text from CSV, extracting each row in a separate object
 * @param path Path to the CSV
 * @returns Decoded data
 */
function parse_csv<T>(path: string) {
  const csv = fs.readFileSync(path).toString();
  const csv_lines = csv.split('\n');
  const header_fields = csv_lines[0].split(',');

  const lines = csv_lines.slice(1).map((entry) => {
    const line: Partial<Record<keyof T, string>> = {};
    const csv_row = entry.split(',');

    for (let i = 0; i < header_fields.length; i++) {
      const field = header_fields[i] as keyof T;
      line[field] = csv_row[i];
    }

    return line;
  });

  return lines;
}

export default parse_csv;
