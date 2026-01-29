package com.schooldashboard.service;

import com.schooldashboard.model.DailyNews;
import com.schooldashboard.model.ParsedPlanDocument;
import com.schooldashboard.model.SubstitutionEntry;
import com.schooldashboard.model.SubstitutionPlan;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

@Service
public class SubstitutionPlanParserService {

  public SubstitutionPlan parseSubstitutionPlanFromUrl(String url) {
    return parsePlanDocumentFromUrl(url).getPlan();
  }

  public ParsedPlanDocument parsePlanDocumentFromUrl(String url) {
    try {
      // Connect to the URL and get the document
      Document doc = Jsoup.connect(url).get();
      SubstitutionPlan plan = parseDocument(doc);
      return new ParsedPlanDocument(plan, doc.outerHtml());
    } catch (IOException e) {
      throw new RuntimeException("Error fetching or parsing substitution plan", e);
    }
  }

  private SubstitutionPlan parseDocument(Document doc) {
    SubstitutionPlan plan = new SubstitutionPlan();

    // Extract date from the page
    Element titleElement = doc.selectFirst("div.mon_title");
    if (titleElement != null) {
      String dateText = titleElement.text().trim();
      plan.setDate(dateText);
      plan.getNews().setDate(dateText);
    }

    // Extract any additional information
    Elements infoElements = doc.select("table.info tr.info");
    if (!infoElements.isEmpty()) {
      StringBuilder infoBuilder = new StringBuilder();
      for (Element infoElement : infoElements) {
        String infoText = infoElement.text().trim();
        if (!infoText.isEmpty()) {
          infoBuilder.append(infoText).append(" ");
        }
      }
      plan.setTitle(infoBuilder.toString().trim());
    }

    // Extract news for the day - look for elements after "Nachrichten zum Tag" heading
    extractDailyNews(doc, plan.getNews());

    // Extract table data for substitutions - first get the headers
    Element tableElement = doc.selectFirst("table.mon_list");
    if (tableElement != null) {
      Elements headerElements = tableElement.select("tr.list th");

      // Create a mapping between column index and field type
      Map<Integer, String> columnMap = new HashMap<>();
      for (int i = 0; i < headerElements.size(); i++) {
        String header = headerElements.get(i).text().toLowerCase().trim();

        if (header.contains("klasse")) {
          columnMap.put(i, "classes");
        } else if (header.contains("stunde")) {
          columnMap.put(i, "period");
        } else if (header.contains("abwesend")) {
          columnMap.put(i, "absent");
        } else if (header.contains("vertreter")) {
          columnMap.put(i, "substitute");
        } else if (header.contains("(fach)")) {
          columnMap.put(i, "originalSubject");
        } else if (header.contains("fach") && !header.contains("(fach)")) {
          columnMap.put(i, "subject");
        } else if (header.contains("raum")) {
          columnMap.put(i, "room");
        } else if (header.contains("art")) {
          columnMap.put(i, "type");
        } else if (header.contains("bemerkung")) {
          columnMap.put(i, "comment");
        }
      }

      // Process each row in the table
      Elements rowElements = tableElement.select("tr.list.odd, tr.list.even");
      for (Element row : rowElements) {
        Elements cells = row.select("td");

        if (!cells.isEmpty()) {
          SubstitutionEntry entry = new SubstitutionEntry();
          entry.setDate(plan.getDate());

          // Map each cell to the appropriate field based on the column index
          for (int i = 0; i < cells.size(); i++) {
            String value = cells.get(i).text().trim();
            String fieldType = columnMap.getOrDefault(i, null);

            if (fieldType != null) {
              switch (fieldType) {
                case "classes":
                  entry.setClasses(value);
                  break;
                case "period":
                  entry.setPeriod(value);
                  break;
                case "absent":
                  entry.setAbsent(value);
                  break;
                case "substitute":
                  entry.setSubstitute(value);
                  break;
                case "originalSubject":
                  entry.setOriginalSubject(value);
                  break;
                case "subject":
                  entry.setSubject(value);
                  break;
                case "room":
                  entry.setNewRoom(value);
                  break;
                case "type":
                  entry.setType(value);
                  break;
                case "comment":
                  entry.setComment(value);
                  break;
              }
            }
          }

          plan.addEntry(entry);
        }
      }
    }

    return plan;
  }

  private void extractDailyNews(Document doc, DailyNews news) {
    // Looking for any elements containing "Nachrichten zum Tag"
    Elements newsHeaders = doc.getElementsContainingOwnText("Nachrichten zum Tag");

    if (!newsHeaders.isEmpty()) {
      Element newsHeader = newsHeaders.first();
      Element parent = (newsHeader == null) ? null : newsHeader.parent();

      // Look for paragraphs or divs after the header
      if (parent != null) {
        Elements newsElements = parent.nextElementSiblings();
        for (Element element : newsElements) {
          String text = element.text().trim();
          if (text.length() > 0 && !text.contains("Untis Stundenplan")) {
            news.addNewsItem(text);
          }
        }
      }

      // If no siblings found, try looking for content within a font or p tag
      if (news.getNewsItems().isEmpty()) {
        Elements fontElements = doc.select("font[size=4]");
        for (Element font : fontElements) {
          news.addNewsItem(font.text().trim());
        }
      }
    }
  }
}
