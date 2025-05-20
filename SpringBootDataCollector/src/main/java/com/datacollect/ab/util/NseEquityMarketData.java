import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NseEquityMarketData {

    private static final String NSE_URL = "https://www.nseindia.com/market-data/live-equity-market";

    public static void main(String[] args) {
        try {
            // 1. Fetch the HTML content
            Document doc = Jsoup.connect(NSE_URL)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3")
                    .get();

            // 2. Extract Key Market Statistics
            Map<String, String> marketStats = extractMarketStatistics(doc);
            System.out.println("Market Statistics:");
            marketStats.forEach((key, value) -> System.out.println(key + ": " + value));
            System.out.println("--------------------");

            // 3. Extract Table Data (Example - Top Gainers)
            List<Map<String, String>> topGainers = extractTableData(doc, "Top Gainers");
            System.out.println("Top Gainers:");
            topGainers.forEach(row -> System.out.println(row));
            System.out.println("--------------------");

            // You can add extraction logic for other tables (Top Losers, etc.)

        } catch (IOException e) {
            System.err.println("Error fetching data from NSE: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error processing data: " + e.getMessage());
        }
    }

    // Helper method to extract Market Statistics (Advances, Declines, Unchanged)
    private static Map<String, String> extractMarketStatistics(Document doc) {
        Map<String, String> stats = new HashMap<>();
        Elements advances = doc.select("span:contains(Advances) + span");
        Elements declines = doc.select("span:contains(Declines) + span");
        Elements unchanged = doc.select("span:contains(Unchanged) + span");

        if (!advances.isEmpty()) stats.put("Advances", advances.first().text());
        if (!declines.isEmpty()) stats.put("Declines", declines.first().text());
        if (!unchanged.isEmpty()) stats.put("Unchanged", unchanged.first().text());

        return stats;
    }


    // Helper method to extract data from a table based on its title
    private static List<Map<String, String>> extractTableData(Document doc, String tableTitle) {
        List<Map<String, String>> tableData = new ArrayList<>();
        // This is a VERY basic way to find the table. You'll need to adjust the selector
        // based on the ACTUAL HTML structure of the NSE page.  It's VERY likely that
        // the structure is more complex than simply finding a table *after* a heading.
        Element table = doc.select("h2:contains(" + tableTitle + ") + table").first();

        if (table != null) {
            // Extract headers from the <thead>
            Elements headers = table.select("thead th");
            List<String> headerTexts = new ArrayList<>();
            for (Element header : headers) {
                headerTexts.add(header.text());
            }

            // Extract data rows from the <tbody>
            Elements rows = table.select("tbody tr");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() == headerTexts.size()) {
                    Map<String, String> rowData = new HashMap<>();
                    for (int i = 0; i < headerTexts.size(); i++) {
                        rowData.put(headerTexts.get(i), cells.get(i).text());
                    }
                    tableData.add(rowData);
                }
            }
        } else {
            System.out.println("Table with title '" + tableTitle + "' not found.");
        }

        return tableData;
    }
}
