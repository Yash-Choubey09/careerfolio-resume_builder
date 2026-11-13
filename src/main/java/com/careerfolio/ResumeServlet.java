package com.careerfolio;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Stores the current resume in the user's HTTP session and exchanges it as XML. */
public class ResumeServlet extends HttpServlet {
    private static final String RESUME_KEY = "careerfolio.resume";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Object resume = request.getSession().getAttribute(RESUME_KEY);
        if ("word".equalsIgnoreCase(request.getParameter("format"))) {
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/msword; charset=UTF-8");
            response.setHeader("Content-Disposition", "attachment; filename=Careerfolio-Resume.doc");
            response.getWriter().write(toWordHtml(asFields(resume)));
            return;
        }
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/xml");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(toXml(resume == null ? new LinkedHashMap<>() : resume));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        request.setCharacterEncoding("UTF-8");
        Map<String, List<String>> resume = new LinkedHashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (key.matches("[a-zA-Z][a-zA-Z0-9]*") && values != null && values.length > 0) {
                List<String> entries = new ArrayList<>();
                for (String value : values) entries.add(value == null ? "" : value.trim());
                resume.put(key, entries);
            }
        });
        request.getSession().setAttribute(RESUME_KEY, resume);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/xml");
        response.getWriter().write("<result status=\"saved\">Resume saved</result>");
    }

    private String toXml(Object stored) {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><resume>");
        if (stored instanceof Map<?, ?>) {
            ((Map<?, ?>) stored).forEach((key, rawValues) -> {
                if (!(key instanceof String)) return;
                if (rawValues instanceof Iterable<?>) {
                    for (Object value : (Iterable<?>) rawValues) appendField(xml, (String) key, value);
                } else {
                    appendField(xml, (String) key, rawValues);
                }
            });
        }
        return xml.append("</resume>").toString();
    }

    private Map<String, List<String>> asFields(Object stored) {
        Map<String, List<String>> fields = new LinkedHashMap<>();
        if (!(stored instanceof Map<?, ?>)) return fields;
        ((Map<?, ?>) stored).forEach((key, rawValues) -> {
            if (!(key instanceof String)) return;
            List<String> values = new ArrayList<>();
            if (rawValues instanceof Iterable<?>) {
                for (Object value : (Iterable<?>) rawValues) values.add(value == null ? "" : value.toString());
            } else if (rawValues != null) {
                values.add(rawValues.toString());
            }
            fields.put((String) key, values);
        });
        return fields;
    }

    private String toWordHtml(Map<String, List<String>> fields) {
        String accent = "#243cff";
        String accentName = first(fields, "accentColor", 0);
        if ("plum".equals(accentName)) accent = "#8150a0";
        else if ("forest".equals(accentName)) accent = "#2f795e";
        else if ("terracotta".equals(accentName)) accent = "#a34f3b";
        String template = first(fields, "template", 0);
        if (!template.matches("modern|executive|minimal|creative|graduate|classic")) template = "modern";

        StringBuilder html = new StringBuilder("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Resume</title><style>")
                .append("body{font-family:'Times New Roman',Times,serif;color:#20212a;font-size:10.5pt;line-height:1.45}body *{font-family:'Times New Roman',Times,serif}h1{font-size:25pt;margin:0;color:#171820}h2{font-size:10pt;text-transform:uppercase;letter-spacing:1.5pt;color:")
                .append(accent).append(";border-bottom:1px solid #bbb;padding-bottom:4pt;margin:20pt 0 8pt}p{margin:4pt 0}.role{font-size:12pt;color:")
                .append(accent).append("}.meta{color:#555;font-size:9pt}.entry{margin:8pt 0;page-break-inside:avoid}.entry strong{font-size:11pt}.date{float:right;color:#555;font-size:9pt}.bullet{margin-left:14pt}")
                .append("body.template-executive h1,body.template-classic h1{text-align:center;font-family:'Times New Roman',Times,serif;font-weight:normal;letter-spacing:1pt}body.template-executive .role,body.template-classic .role{text-align:center}body.template-minimal h1{font-weight:normal}body.template-creative h1{border-left:5px solid ")
                .append(accent).append(";padding:8pt 12pt;background:#f4eafa}body.template-graduate h2:first-of-type{margin-top:12pt}</style></head><body class=\"template-")
                .append(template).append("\">");
        html.append("<h1>").append(htmlEscape(first(fields, "fullName", 0))).append("</h1>");
        appendParagraph(html, "role", first(fields, "jobTitle", 0));
        String contact = String.join(" · ", Arrays.asList(first(fields, "email", 0), first(fields, "phone", 0), first(fields, "location", 0), first(fields, "website", 0)));
        if (!contact.replace("·", "").trim().isEmpty()) appendParagraph(html, "meta", contact);
        appendSection(html, "Profile", first(fields, "summary", 0));

        html.append("<h2>Experience</h2>");
        int experienceCount = size(fields, "experienceTitle", "experienceCompany", "experienceDates", "experienceLocation", "experienceDescription");
        for (int i = 0; i < experienceCount; i++) {
            String title = first(fields, "experienceTitle", i);
            String company = first(fields, "experienceCompany", i);
            String dates = first(fields, "experienceDates", i);
            String location = first(fields, "experienceLocation", i);
            String description = first(fields, "experienceDescription", i);
            html.append("<div class=\"entry\"><p><strong>").append(htmlEscape(title.isEmpty() ? "Position" : title)).append("</strong><span class=\"date\">").append(htmlEscape(dates)).append("</span></p>");
            appendParagraph(html, "meta", String.join(" · ", Arrays.asList(company, location)).replaceAll("^( · )+|( · )+$", ""));
            appendParagraph(html, "", description);
            html.append("</div>");
        }

        html.append("<h2>Education</h2>");
        int educationCount = size(fields, "educationDegree", "educationSchool", "educationYear");
        for (int i = 0; i < educationCount; i++) {
            html.append("<div class=\"entry\"><p><strong>").append(htmlEscape(first(fields, "educationDegree", i))).append("</strong><span class=\"date\">").append(htmlEscape(first(fields, "educationYear", i))).append("</span></p>");
            appendParagraph(html, "meta", first(fields, "educationSchool", i));
            html.append("</div>");
        }
        appendSection(html, "Skills", first(fields, "skills", 0));
        return html.append("</body></html>").toString();
    }

    private int size(Map<String, List<String>> fields, String... keys) {
        int count = 0;
        for (String key : keys) count = Math.max(count, fields.getOrDefault(key, new ArrayList<>()).size());
        return count;
    }

    private String first(Map<String, List<String>> fields, String key, int index) {
        List<String> values = fields.get(key);
        return values == null || index >= values.size() ? "" : values.get(index);
    }

    private void appendSection(StringBuilder html, String title, String value) {
        html.append("<h2>").append(title).append("</h2>");
        appendParagraph(html, "", value);
    }

    private void appendParagraph(StringBuilder html, String cssClass, String value) {
        if (value == null || value.trim().isEmpty()) return;
        html.append("<p");
        if (!cssClass.isEmpty()) html.append(" class=\"").append(cssClass).append("\"");
        html.append(">").append(htmlEscape(value).replace("\n", "<br>")).append("</p>");
    }

    private String htmlEscape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private void appendField(StringBuilder xml, String key, Object value) {
        xml.append("<field name=\"").append(escape(key)).append("\">")
                .append(escape(value == null ? "" : value.toString())).append("</field>");
    }

    private String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}
