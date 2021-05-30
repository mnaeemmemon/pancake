import React from 'react'


type ColumnDefinitionType<T, K extends keyof T> = {
    key: K;
    header: string;
    width?: number;
}
type TableHeaderProps<T, K extends keyof T> = {
    columns: Array<ColumnDefinitionType<T, K>>;
}

const TableHeader = <T, K extends keyof T>({ columns }: TableHeaderProps<T, K>): JSX.Element => {
    const headers = columns.map((column) => {
        const style = {
            width: column.width ?? 100, // 100 is our default value if width is not defined
            borderBottom: '2px solid black'
        };

        return (
            <th
                key={`headCell-${column.key}`}
                style={style}
            >
                {column.header}
            </th>
        );
    });

    return (
        <thead>
            <tr>{headers}</tr>
        </thead>
    );
};

export default TableHeader;