// In-memory search index replicating Go's search.Index
export class SearchIndex {
  private usernames = new Set<string>();

  addUsername(username: string) {
    this.usernames.add(username.toLowerCase());
  }

  usernameMayExist(username: string): boolean {
    return this.usernames.has(username.toLowerCase());
  }

  searchUsernames(query: string, limit: number): string[] {
    const q = query.toLowerCase();
    const results: string[] = [];
    for (const username of this.usernames) {
      if (username.includes(q)) {
        results.push(username);
        if (results.length >= limit) break;
      }
    }
    return results.sort(); // Simple sort, Go had more advanced sorting but this suffices for now
  }
}

export const globalSearchIndex = new SearchIndex();
