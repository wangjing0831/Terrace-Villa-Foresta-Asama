package jp.forestaasama.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${media.storage-mode:local}")
    private String storageMode;

    @Value("${media.local-path:./data/local-media}")
    private String localPath;

    @Value("${media.s3.bucket-name:terrace-villa-foresta-asama-prod}")
    private String bucketName;

    @Value("${media.s3.region:ap-northeast-1}")
    private String region;

    @Value("${media.s3.presigned-url-expiry:3600}")
    private int presignedUrlExpiry;

    /**
     * Upload a file to storage (local or S3 based on profile)
     * @return stored URL/path
     */
    public String upload(MultipartFile file, String category) throws IOException {
        String extension = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "." + extension;

        if ("s3".equals(storageMode)) {
            return uploadToS3(file, category, storedName);
        } else {
            return uploadToLocal(file, category, storedName);
        }
    }

    /**
     * Delete a file from storage
     */
    public void delete(String storagePath) throws IOException {
        if ("s3".equals(storageMode)) {
            deleteFromS3(storagePath);
        } else {
            deleteFromLocal(storagePath);
        }
    }

    /**
     * Get a presigned URL for S3 objects (frontend can access directly)
     */
    public String getPresignedUrl(String s3Key) {
        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.of(region))
                .build()) {

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(presignedUrlExpiry))
                    .getObjectRequest(r -> r.bucket(bucketName).key(s3Key))
                    .build();

            return presigner.presignGetObject(presignRequest).url().toString();
        }
    }

    private String uploadToS3(MultipartFile file, String category, String storedName) throws IOException {
        String key = "media/" + category + "/" + storedName;

        S3Client s3 = S3Client.builder()
                .region(Region.of(region))
                .build();

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );

        s3.close();
        return key;  // Return S3 key, frontend will request presigned URL
    }

    private String uploadToLocal(MultipartFile file, String category, String storedName) throws IOException {
        Path categoryDir = Paths.get(localPath, category);
        Files.createDirectories(categoryDir);

        Path filePath = categoryDir.resolve(storedName);
        file.transferTo(filePath.toFile());

        // Return relative URL for serving
        return "/media/" + category + "/" + storedName;
    }

    private void deleteFromS3(String key) {
        S3Client s3 = S3Client.builder()
                .region(Region.of(region))
                .build();
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build());
        s3.close();
    }

    private void deleteFromLocal(String url) throws IOException {
        // Convert URL to local path
        String relativePath = url.replace("/media/", "");
        Path filePath = Paths.get(localPath, relativePath);
        Files.deleteIfExists(filePath);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
