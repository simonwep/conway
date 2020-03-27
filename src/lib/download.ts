/**
 * Triggers a download with the content as content and the name
 * as filename.
 * @param content
 * @param name
 */
export function download(content: BlobPart, name: string): void {
    const blob = new Blob([content]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.style.display = 'none';

    link.href = url;
    link.download = name;
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
