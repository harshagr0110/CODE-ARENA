// In-memory store for coding questions

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topics: string[];
  testCases: Array<{ input: string; expectedOutput: string; explanation?: string }>;
  createdBy: string;
  creator?: { username: string };
}


class QuestionsStore {

  remove(id: string) {
    const idx = this.questions.findIndex((q: any) => q.id === id);
    if (idx !== -1) {
      this.questions.splice(idx, 1);
    }
  }
  private questions: Question[] = [];

  add(question: Question) {
    this.questions.unshift(question);
  }

  list({ where, limit }: { where?: any; limit?: number }) {
    let filtered = this.questions;
    if (where) {
      if (where.difficulty) filtered = filtered.filter(q => q.difficulty === where.difficulty);
    }
    if (limit) filtered = filtered.slice(0, limit);
    return filtered;
  }

  getById(id: string) {
    return this.questions.find(q => q.id === id);
  }
  

}

export const questionsStore = new QuestionsStore();
