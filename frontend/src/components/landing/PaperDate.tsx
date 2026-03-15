"use client";

import { useState, useEffect } from "react";

export default function PaperDate() {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return <div className="l-paper-eyebrow">{date}</div>;
}
