import {renderToStaticMarkup} from 'react-dom/server';


// For converting a react-virtualized table into a CSV in the client for download.
// Reads the `<Column />` definition for `label` and `cellRenderer`.
// Minimal implementation for reading Column and for escaping.
export function toCsvTextFromTable(columns, rows, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = columns.map(column => column.label.replace(/\s/g, '_'));
  const lines = rows.map(row => toCsvColumns(columns, row).join(delimiter));
  return [headers.join(delimiter)].concat(lines).join("\n");
}

function toCsvColumns(columns, rowData) {
  return columns.map(column => {
    const html = column.cellRenderer({rowData});
    return (html) ? elementAsText(html) : '';
  });
}

function elementAsText(element) {
  return $(renderToStaticMarkup(element)).text();
}
