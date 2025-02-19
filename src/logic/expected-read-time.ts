export function getExpectedReadTime(innerText: string): string {
    const averageWordsPerMinute = 250;
    const words = innerText.split(' ').length;
    const expectedMinutes = Math.max(Math.ceil(words / averageWordsPerMinute), 1);

    return `${expectedMinutes}min`;
}
