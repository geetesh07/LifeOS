// Date formatting utilities for consistent DD/MM/YYYY format throughout the app
import { format as dateFnsFormat } from 'date-fns';

// Format date as DD/MM/YYYY
export function formatDate(date: Date | string): string {
    return dateFnsFormat(new Date(date), 'dd/MM/yyyy');
}

// Format date as DD/MM/YYYY HH:mm
export function formatDateTime(date: Date | string): string {
    return dateFnsFormat(new Date(date), 'dd/MM/yyyy HH:mm');
}

// Format date as DD MMM (e.g., "15 Dec")
export function formatDateShort(date: Date | string): string {
    return dateFnsFormat(new Date(date), 'dd MMM');
}

// Format date as DD MMM YYYY (e.g., "15 Dec 2024")
export function formatDateMedium(date: Date | string): string {
    return dateFnsFormat(new Date(date), 'dd MMM yyyy');
}

// For HTML date inputs (YYYY-MM-DD required)
export function formatDateInput(date: Date | string): string {
    return dateFnsFormat(new Date(date), 'yyyy-MM-dd');
}
