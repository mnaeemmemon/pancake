import React from 'react'

type ColumnDefinitionType<T, K extends keyof T> = {
  key: K;
  header: string;
  width?: number;
}
type TableRowsProps<T, K extends keyof T> = {
    data: Array<T>;
    columns: Array<ColumnDefinitionType<T, K>>;
  }
  
  const style = {
    border: '1px solid black'
  }
  
  const TableRows = <T, K extends keyof T>({ data, columns }: TableRowsProps<T, K>): JSX.Element => {
    const rows = data.map((row) => {
      return (
        <tr>
          {columns.map((column) => {
            return (
              <td key={`cell-${column.key}`} style={style}>
                {row[column.key]}
              </td>
            );
          }
          )}
        </tr>
      );
    });
  
    return (
      <tbody>
        {rows}
      </tbody>
    );
  };
  
  export default TableRows;