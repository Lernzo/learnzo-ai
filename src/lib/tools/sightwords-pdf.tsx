import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", color: "#0f172a" },
  brand: { fontSize: 16, fontWeight: 700, color: "#1a4bdd", textAlign: "center" },
  tag: { fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 2, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  card: {
    width: "33.33%",
    height: 100,
    padding: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#94a3b8",
    justifyContent: "center",
    alignItems: "center"
  },
  word: { fontSize: 24, fontWeight: 700, color: "#0f172a" },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 8, color: "#94a3b8", textAlign: "center" }
});

const WORDS = [
  "a","and","away","big","blue","can","come","down","find","for",
  "funny","go","help","here","I","in","is","it","jump","little",
  "look","make","me","my","not","one","play","red","run","said",
  "see","the","three","to","two","up","we","where","yellow","you",
  "all","am","are","at","ate","be","black","brown","but","came",
  "did","do","eat","four","get","good","have","he","into","like",
  "must","new","no","now","on","our","out","please","pretty","ran",
  "ride","saw","say","she","so","soon","that","there","they","this",
  "too","under","want","was","well","went","what","white","who","will",
  "with","yes","after","again","an","any","as","ask","by","could"
];

export function SightWordsPDF() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>LEARNZO</Text>
        <Text style={styles.tag}>Sight Words Flashcards - learnzo.online</Text>

        <View style={styles.grid}>
          {WORDS.map((w, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.word}>{w}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Cut along the dashed lines. 100 sight words for ages 4 to 7.</Text>
      </Page>
    </Document>
  );
}