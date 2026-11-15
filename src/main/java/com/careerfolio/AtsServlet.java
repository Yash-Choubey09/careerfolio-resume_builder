package com.careerfolio;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Scores resume content using transparent ATS heuristics without requiring a paid API key. */
public class AtsServlet extends HttpServlet {
    private static final Set<String> HEADINGS = new HashSet<>(Arrays.asList(
            "summary", "profile", "experience", "work experience", "education", "skills", "projects"));

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!AuthServlet.isAuthenticated(request)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Sign in to analyze a resume.");
            return;
        }
        String text = request.getParameter("text") == null ? "" : request.getParameter("text").trim();
        if (text.isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Resume text is required.");
            return;
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        int score = 35;
        if (normalized.matches("(?s).*\\b[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}\\b.*")) score += 15;
        if (normalized.matches("(?s).*\\b(19|20)\\d{2}\\b.*")) score += 10;
        int headingCount = 0;
        for (String heading : HEADINGS) if (normalized.contains(heading)) headingCount++;
        score += Math.min(25, headingCount * 5);
        if (normalized.contains("achieved") || normalized.contains("%") || normalized.contains("increased")) score += 10;
        if (text.length() >= 500) score += 5;
        score = Math.min(100, score);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"provider\":\"careerfolio-local\",\"score\":" + score +
                ",\"checks\":{\"contact\":\"" + (normalized.matches("(?s).*\\b[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}\\b.*") ? "pass" : "missing") +
                "\",\"sections\":" + headingCount + ",\"length\":\"" + (text.length() >= 500 ? "pass" : "short") +
                "\"},\"message\":\"Add measurable outcomes and keywords from the job description for a stronger match.\"}");
    }
}
