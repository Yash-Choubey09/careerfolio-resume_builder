package com.careerfolio;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Provides lightweight account registration and login for the single-node app. */
public class AuthServlet extends HttpServlet {
    private static final String USER_KEY = "careerfolio.user";
    private static final Map<String, UserRecord> USERS = new ConcurrentHashMap<>();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ITERATIONS = 120_000;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String user = (String) request.getSession().getAttribute(USER_KEY);
        response.getWriter().write(user == null ? "{\"authenticated\":false}" :
                "{\"authenticated\":true,\"email\":\"" + json(user) + "\"}");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");
        if ("logout".equals(action)) {
            request.getSession().invalidate();
            write(response, 200, "{\"authenticated\":false}");
            return;
        }
        String email = request.getParameter("email") == null ? "" : request.getParameter("email").trim().toLowerCase();
        String password = request.getParameter("password") == null ? "" : request.getParameter("password");
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || password.length() < 8) {
            write(response, 400, "{\"error\":\"Use a valid email and a password of at least 8 characters.\"}");
            return;
        }
        if ("register".equals(action)) {
            byte[] salt = randomSalt();
            if (USERS.putIfAbsent(email, new UserRecord(Base64.getEncoder().encodeToString(derive(password.toCharArray(), salt)), salt)) != null) {
                write(response, 409, "{\"error\":\"An account with this email already exists.\"}");
                return;
            }
        } else if ("login".equals(action)) {
            UserRecord record = USERS.get(email);
            if (record == null || !matches(password.toCharArray(), record)) {
                write(response, 401, "{\"error\":\"Email or password is incorrect.\"}");
                return;
            }
        } else {
            write(response, 400, "{\"error\":\"Unsupported authentication action.\"}");
            return;
        }
        request.getSession(true).setAttribute(USER_KEY, email);
        write(response, 200, "{\"authenticated\":true,\"email\":\"" + json(email) + "\"}");
    }

    static boolean isAuthenticated(HttpServletRequest request) {
        return request.getSession(false) != null && request.getSession(false).getAttribute(USER_KEY) != null;
    }

    private void write(HttpServletResponse response, int status, String body) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(body);
    }

    private static byte[] randomSalt() {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return salt;
    }

    private static boolean matches(char[] password, UserRecord record) {
        return MessageDigest.isEqual(derive(password, record.salt), Base64.getDecoder().decode(record.hash));
    }

    private static byte[] derive(char[] password, byte[] salt) {
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(new PBEKeySpec(password, salt, ITERATIONS, 256)).getEncoded();
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Password hashing is unavailable", exception);
        }
    }

    private static String json(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static final class UserRecord {
        private final String hash;
        private final byte[] salt;

        private UserRecord(String hash, byte[] salt) {
            this.hash = hash;
            this.salt = salt;
        }
    }
}
