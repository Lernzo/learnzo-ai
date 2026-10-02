import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer
} from "@react-pdf/renderer";
import type { PracticeQuestion } from "../ai/schema";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#0f172a"
  },

  // Header
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a4bdd"
  },
  brandAccent: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a"
  },
  brandTag: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2
  },
  brandSite: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "right"
  },

  // Meta box
  metaBox: {
    marginTop: 18,
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid"
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 6
  },
  metaKey: {
    width: 110,
    color: "#64748b"
  },
  metaVal: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#94a3b8",
    borderBottomStyle: "solid",
    minHeight: 16,
    paddingBottom: 2
  },

  // Section headings
  sectionHeading: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 10
  },

  // Question block
  qBlock: {
    marginBottom: 22
  },
  qText: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 10
  },
  qNum: {
    fontWeight: 700
  },
  writeLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
    height: 26
  },
  levelBadge: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 3,
    textTransform: "uppercase"
  },

  // Answer key box
  keyBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 6
  },
  keyHead: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10
  },
  keyRow: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.4
  },
  keyStrong: {
    fontWeight: 700
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 6
  }
});

interface SheetProps {
  studentName: string;
  subject: string;
  topic: string;
  questions: PracticeQuestion[];
}

function Sheet({ studentName, subject, topic, questions }: SheetProps) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <Document
      title={`Learnzo - Practice Worksheet - ${topic}`}
      author="Learnzo"
      subject={`Practice worksheet on ${topic}`}
      creator="Learnzo"
    >
      {/* ---------------- Student worksheet ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text>
              <Text style={styles.brand}>Learnzo</Text>
            </Text>
            <Text style={styles.brandTag}>
              Homework Help That Helps You Understand
            </Text>
          </View>
          <Text style={styles.brandSite}>learnzo.online</Text>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Student Name:</Text>
            <Text style={styles.metaVal}>{studentName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Date:</Text>
            <Text style={styles.metaVal}>{today}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Subject:</Text>
            <Text style={styles.metaVal}>{subject}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Topic:</Text>
            <Text style={styles.metaVal}>{topic}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Practice Worksheet</Text>

        {questions.map((q, i) => (
          <View key={i} style={styles.qBlock} wrap={false}>
            <Text style={styles.levelBadge}>{q.level}</Text>
            <Text style={styles.qText}>
              <Text style={styles.qNum}>Q{i + 1}. </Text>
              {q.question}
            </Text>
            <View style={styles.writeLine} />
            <View style={styles.writeLine} />
            <View style={styles.writeLine} />
            <View style={styles.writeLine} />
          </View>
        ))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Learnzo  -  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>

      {/* ---------------- Answer key ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text>
              <Text style={styles.brand}>Learnzo</Text>
            </Text>
            <Text style={styles.brandTag}>Answer Key - for parents and teachers</Text>
          </View>
          <Text style={styles.brandSite}>learnzo.online</Text>
        </View>

        <Text style={styles.sectionHeading}>Answer Key</Text>

        <View style={styles.keyBox}>
          {questions.map((q, i) => (
            <Text key={i} style={styles.keyRow}>
              <Text style={styles.keyStrong}>Q{i + 1}. </Text>
              {q.answer}
              {q.explanation ? `  (${q.explanation})` : ""}
            </Text>
          ))}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Learnzo  -  Answer Key  -  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export interface BuildPdfArgs {
  studentName?: string;
  subject: string;
  topic: string;
  questions: PracticeQuestion[];
}

export async function buildPracticePdf(args: BuildPdfArgs): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <Sheet
      studentName={args.studentName?.trim() || ""}
      subject={args.subject}
      topic={args.topic}
      questions={args.questions}
    />
  );
  return Buffer.from(buffer);
}