# Careerfolio Resume Builder

Careerfolio is a polished resume studio built with Java Servlets, JSP, XML, HTML, CSS, and vanilla JavaScript. It lets people choose a layout, edit their story with a live preview, save drafts locally, and print or save a resume as PDF.

## Features

- Six resume layouts for modern, executive, minimal, creative, graduate, and classic use cases
- Live preview with editable profile, summary, experience, skills, and education sections
- Browser-local autosave with an optional Java HTTP-session save
- Print-ready PDF export through the browser print dialog
- Word-compatible `.doc` export from the Java servlet
- Responsive landing page and resume editor

## Stack

- Java 11+
- Maven
- Java Servlets 4
- JSP
- Apache Tomcat 9+
- XML session endpoint
- Vanilla JavaScript and CSS

## Run locally with Tomcat

### Requirements

- Java 11 or newer
- Maven
- Apache Tomcat 9 or another Servlet 4 compatible container

### Build and run

```bash
mvn clean package
```

Copy `target/careerfolio.war` into Tomcat's `webapps` directory, start Tomcat, and open:

```text
http://localhost:8080/careerfolio/
```

The application exposes `POST /careerfolio/api/resume` to save a draft and `GET /careerfolio/api/resume` to read it as XML. Word export is available with `?format=word`.

## Vercel preview

The `public/` directory is a static preview for Vercel. It keeps the landing page, resume editor, browser autosave, live preview, and PDF printing available without a Java runtime. The server-backed XML session and Word export require the Tomcat deployment.

Deploy with the Vercel CLI:

```bash
npx vercel --prod
```

The included `vercel.json` maps the original `.jsp` entry URLs to their static preview equivalents.

## Project layout

```text
src/main/java/          Resume servlet and server-side exports
src/main/webapp/        Canonical JSP application and browser assets
public/                 Vercel-compatible static preview
stitch-import/          Design references and imported visual assets
pom.xml                 Maven WAR build configuration
```

## Privacy

Resume information is stored in the browser's local storage and, when running on Tomcat, the user's private HTTP session. The project does not use an external database.
