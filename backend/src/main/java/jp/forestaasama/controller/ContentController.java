package jp.forestaasama.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yaml.snakeyaml.Yaml;

import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ContentController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @Value("${content.yaml-path:./data/content}")
    private String yamlPath;

    /**
     * GET /api/content/hotel - Get hotel content
     */
    @GetMapping("/api/content/hotel")
    public ResponseEntity<Map<String, Object>> getHotelContent() {
        return ResponseEntity.ok(loadYaml("hotel.yml"));
    }

    /**
     * GET /api/content/plans - Get travel plans
     */
    @GetMapping("/api/content/plans")
    public ResponseEntity<Map<String, Object>> getPlans() {
        return ResponseEntity.ok(loadYaml("plans.yml"));
    }

    /**
     * GET /api/content/plans/{id} - Get a specific plan
     */
    @GetMapping("/api/content/plans/{id}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> getPlan(@PathVariable String id) {
        Map<String, Object> plans = loadYaml("plans.yml");
        Object planList = plans.get("plans");
        if (planList instanceof java.util.List) {
            for (Object plan : (java.util.List<?>) planList) {
                if (plan instanceof Map) {
                    Map<String, Object> planMap = (Map<String, Object>) plan;
                    if (id.equals(planMap.get("id"))) {
                        return ResponseEntity.ok(planMap);
                    }
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * GET /api/content/surroundings - Get surroundings content
     */
    @GetMapping("/api/content/surroundings")
    public ResponseEntity<Map<String, Object>> getSurroundings() {
        return ResponseEntity.ok(loadYaml("surroundings.yml"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> loadYaml(String filename) {
        try {
            Yaml yaml = new Yaml();
            String filePath = Paths.get(yamlPath, filename).toString();
            try (InputStream input = new FileInputStream(filePath)) {
                Map<String, Object> data = yaml.load(input);
                return data != null ? data : new HashMap<>();
            }
        } catch (Exception e) {
            // Return empty map if file not found (development fallback)
            return new HashMap<>();
        }
    }
}
