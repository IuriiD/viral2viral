# S3 CORS Configuration for Presigned URL Uploads

## Issue
When uploading files to S3 using presigned URLs from the frontend, you need to configure CORS on the S3 bucket to allow cross-origin requests.

## Required CORS Configuration

Add the following CORS configuration to your S3 bucket (`befitbecool`):

### Option 1: Via AWS Console

1. Go to AWS S3 Console
2. Select your bucket: `befitbecool`
3. Go to the "Permissions" tab
4. Scroll to "Cross-origin resource sharing (CORS)"
5. Click "Edit"
6. Add the following JSON configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

### Option 2: Via AWS CLI

```bash
# Save CORS configuration to a file
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://yourdomain.com"
      ],
      "ExposeHeaders": [
        "ETag",
        "x-amz-server-side-encryption",
        "x-amz-request-id",
        "x-amz-id-2"
      ],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors --bucket befitbecool --cors-configuration file://cors-config.json
```

### Option 3: Via Terraform (if using IaC)

```hcl
resource "aws_s3_bucket_cors_configuration" "bucket_cors" {
  bucket = aws_s3_bucket.befitbecool.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://yourdomain.com"
    ]
    expose_headers = [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ]
    max_age_seconds = 3000
  }
}
```

## Explanation

- **AllowedHeaders**: `["*"]` allows all headers (needed for presigned URLs)
- **AllowedMethods**: `["GET", "PUT", "POST", "DELETE", "HEAD"]` allows all necessary HTTP methods
- **AllowedOrigins**: List of origins that can access the bucket
  - `http://localhost:5173` - Vite dev server (frontend)
  - `http://localhost:3000` - Backend API (if needed)
  - Add your production domain(s) when deploying
- **ExposeHeaders**: Headers that browsers can access in responses
- **MaxAgeSeconds**: How long browsers should cache the CORS preflight response

## Security Considerations

### For Development
The configuration above is suitable for development with wildcards for convenience.

### For Production
1. **Replace localhost origins** with your actual production domains:
   ```json
   "AllowedOrigins": [
     "https://yourdomain.com",
     "https://www.yourdomain.com"
   ]
   ```

2. **Consider restricting AllowedHeaders** if you know exactly which headers are needed:
   ```json
   "AllowedHeaders": [
     "Content-Type",
     "Content-Length",
     "x-amz-*"
   ]
   ```

3. **Restrict AllowedMethods** to only what's needed:
   ```json
   "AllowedMethods": ["GET", "PUT"]
   ```

## Testing CORS Configuration

After applying the configuration, test it:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v \
  "https://befitbecool.s3.us-east-1.amazonaws.com/"
```

Expected response headers:
- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD`
- `Access-Control-Allow-Headers: *`

## Troubleshooting

### Still Getting CORS Errors?

1. **Clear browser cache** - CORS preflight responses are cached
2. **Verify bucket name** - Ensure you're applying CORS to the correct bucket
3. **Check AWS region** - Make sure the bucket region matches your configuration
4. **Wait a few minutes** - CORS configuration changes can take a moment to propagate
5. **Check bucket policy** - Ensure your bucket policy doesn't block the uploads

### Verify Current CORS Configuration

```bash
aws s3api get-bucket-cors --bucket befitbecool
```

## Alternative: Backend Proxy Upload

If you cannot modify S3 CORS settings, you can proxy uploads through your backend:

1. Frontend sends file to backend API
2. Backend uploads to S3 server-side
3. No CORS issues since it's server-to-server

However, this approach:
- ❌ Increases backend bandwidth usage
- ❌ Slower (two-hop upload)
- ❌ Higher backend resource usage
- ✅ No CORS configuration needed
- ✅ More control over uploads
- ✅ Better for validation/virus scanning

## Recommended Approach

**Development**: Use presigned URLs with permissive CORS (as configured above)

**Production**: 
- Use presigned URLs with restricted CORS (specific origins only)
- Consider adding CloudFront in front of S3 for better CORS control
- Implement rate limiting on presigned URL generation
- Monitor S3 access logs for abuse
