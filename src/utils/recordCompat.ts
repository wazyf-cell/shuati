import { PracticeRecord, NormalizedRecord } from '../types';

export function normalizeRecord(record: PracticeRecord): NormalizedRecord {
  let bankIds: string[];

  if (record.bankIds && record.bankIds.length > 0) {
    bankIds = record.bankIds;
  } else if (record.bankId) {
    bankIds = [record.bankId];
  } else {
    bankIds = [];
  }

  return {
    id: record.id,
    bankIds,
    questionIds: record.questionIds,
    answers: record.answers,
    results: record.results,
    startTime: record.startTime,
    endTime: record.endTime,
    totalCount: record.totalCount,
    correctCount: record.correctCount,
  };
}

export function normalizeRecords(records: PracticeRecord[]): NormalizedRecord[] {
  return records.map(normalizeRecord);
}