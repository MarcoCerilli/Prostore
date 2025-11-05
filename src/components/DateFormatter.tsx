// ./src/components/DateFormatter.tsx
"use client";

import { useMemo } from 'react';

// Questo componente si occupa solo della formattazione della data/ora
// ed è marcato come Client Component.

interface DateFormatterProps {
    date: Date;
}

export default function DateFormatter({ date }: DateFormatterProps) {
    // Usiamo useMemo per assicurare che la formattazione sia stabile
    // e per evitare che la data cambi ad ogni render, riducendo le possibilità di mismatch.
    const formattedDate = useMemo(() => {
        // Opzioni standard per la formattazione locale della data (es. 04/11/2025)
        return date.toLocaleDateString("it-IT");
    }, [date]);

    return (
        <time dateTime={date.toISOString()}>
            {formattedDate}
        </time>
    );
}