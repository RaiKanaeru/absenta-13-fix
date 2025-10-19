# Panduan Testing Error 413 Fix

## 📋 Overview

Dokumen ini menjelaskan cara menjalankan testing komprehensif untuk memverifikasi bahwa fix error 413 Payload Too Large bekerja dengan baik di berbagai skenario.

## 🎯 Tujuan Testing

1. **Verifikasi Fix Error 413**: Memastikan error 413 tidak terjadi lagi
2. **Test Compression**: Memverifikasi image compression bekerja dengan baik
3. **Test Quality**: Memastikan kualitas image setelah compression masih bagus untuk print
4. **Test Error Handling**: Memverifikasi error handling bekerja dengan baik
5. **Test Edge Cases**: Menguji berbagai skenario edge case

## 🧪 Test Suites

### 1. Comprehensive Tests (`test-error-413-comprehensive.js`)

**Tujuan**: Test utama untuk memverifikasi fix error 413

**Test Cases**:
- Upload logo kecil (<500KB) - should work without compression
- Upload logo sedang (1-2MB) - should compress otomatis
- Upload logo besar (3-5MB) - should compress dengan ratio tinggi
- Upload logo sangat besar (>5MB) - should reject dengan message jelas
- Test berbagai format PNG, JPG, WEBP untuk compatibility
- Test error handling saat network timeout atau error

**Cara Menjalankan**:
```bash
node test-error-413-comprehensive.js
```

### 2. Image Quality Tests (`test-image-quality.js`)

**Tujuan**: Memverifikasi kualitas image setelah compression

**Test Cases**:
- Test compression dengan berbagai quality settings
- Test print quality requirements
- Test image sharpness analysis
- Test berbagai format image
- Test edge cases (very small, very large images)

**Cara Menjalankan**:
```bash
node test-image-quality.js
```

### 3. Error Handling Tests (`test-error-handling.js`)

**Tujuan**: Test error handling dan edge cases

**Test Cases**:
- Network timeout scenarios
- File corruption scenarios
- Memory limit scenarios
- Server error scenarios
- Concurrent upload scenarios
- Edge cases (1x1 pixel, very wide/tall images)

**Cara Menjalankan**:
```bash
node test-error-handling.js
```

### 4. Frontend Tests (`test-frontend-error-413.html`)

**Tujuan**: Test frontend functionality

**Test Cases**:
- File upload validation
- Client-side compression
- Loading states
- Error messages
- Button states
- Preview functionality

**Cara Menjalankan**:
1. Buka `test-frontend-error-413.html` di browser
2. Upload berbagai ukuran file
3. Perhatikan behavior dan error messages

### 5. Master Test Runner (`run-all-tests.js`)

**Tujuan**: Menjalankan semua test suites

**Fitur**:
- Menjalankan semua test suites
- Generate comprehensive report
- HTML report generation
- JSON report generation

**Cara Menjalankan**:
```bash
node run-all-tests.js
```

## 📊 Test Results

### Expected Results

**✅ Passed Tests**:
- Small logo upload (<500KB) - no compression needed
- Medium logo upload (1-2MB) - compressed successfully
- Large logo upload (3-5MB) - compressed with good ratio
- Very large logo upload (>5MB) - rejected with clear message
- All image formats (PNG, JPG, WEBP) - supported
- Error handling - works correctly
- Loading states - displayed properly
- Quality after compression - acceptable for print

**❌ Failed Tests**:
- Any test that shows error 413 still occurring
- Compression not working properly
- Quality too low for print
- Error handling not working
- Loading states not displayed

### Success Criteria

1. **No Error 413**: Error 413 tidak terjadi lagi
2. **Compression Works**: Image compression bekerja dengan baik
3. **Quality Acceptable**: Kualitas image setelah compression masih bagus untuk print
4. **Error Handling**: Error handling bekerja dengan baik
5. **User Experience**: Loading states dan error messages jelas

## 🔧 Test Configuration

### Backend Configuration

```javascript
const compressionOptions = {
    maxWidth: 800,
    maxHeight: 600,
    quality: 80,
    maxSizeKB: 500 // Compress to max 500KB
};

const maxImageSizeKB = 5000; // 5MB max per image
```

### Frontend Configuration

```javascript
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    compressionOptions: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
        maxSizeMB: 0.5
    }
};
```

## 📈 Performance Benchmarks

### Expected Performance

| Image Size | Processing Time | Compression Ratio | Quality |
|------------|----------------|-------------------|---------|
| <500KB     | <200ms        | No compression    | Original |
| 1-2MB      | <1s           | 60-70%           | High    |
| 3-5MB      | <3s           | 70-80%           | Good    |
| >5MB       | Rejected      | N/A              | N/A     |

### Memory Usage

- **Small images**: <10MB
- **Medium images**: <20MB
- **Large images**: <50MB
- **Concurrent processing**: <100MB

## 🐛 Troubleshooting

### Common Issues

1. **Error 413 Still Occurring**
   - Check Express body parser limit
   - Verify compression is working
   - Check payload size logging

2. **Compression Not Working**
   - Check Sharp library installation
   - Verify image compression function
   - Check compression options

3. **Quality Too Low**
   - Adjust compression quality settings
   - Check maxSizeKB limit
   - Verify print quality requirements

4. **Error Handling Not Working**
   - Check error response format
   - Verify try-catch blocks
   - Check error message display

### Debug Steps

1. **Check Logs**: Periksa console logs untuk error messages
2. **Verify Configuration**: Pastikan semua konfigurasi benar
3. **Test Individual Components**: Test setiap komponen secara terpisah
4. **Check Dependencies**: Pastikan semua dependencies terinstall

## 📝 Test Reports

### Report Locations

- **JSON Reports**: `test-reports/master-test-report-{timestamp}.json`
- **HTML Reports**: `test-reports/test-report-{timestamp}.html`
- **Individual Reports**: 
  - `test-error-413-report.json`
  - `image-quality-test-report.json`
  - `error-handling-test-report.json`

### Report Contents

1. **Summary**: Total tests, passed, failed, success rate
2. **Test Suites**: Breakdown per test suite
3. **Individual Tests**: Detailed results per test
4. **Performance Metrics**: Processing times, memory usage
5. **Recommendations**: Suggestions for improvements

## 🚀 Production Readiness

### Checklist

- [ ] All tests passing (100% success rate)
- [ ] No error 413 occurring
- [ ] Compression working properly
- [ ] Quality acceptable for print
- [ ] Error handling working
- [ ] Performance within limits
- [ ] User experience smooth

### Deployment Notes

1. **Server Configuration**: Pastikan Express body parser limit cukup
2. **Dependencies**: Install Sharp library untuk image compression
3. **Monitoring**: Setup monitoring untuk payload size dan error rates
4. **Backup**: Backup konfigurasi lama sebelum deploy

## 📞 Support

Jika ada masalah dengan testing atau implementasi:

1. **Check Logs**: Periksa console logs dan error messages
2. **Review Configuration**: Pastikan semua konfigurasi benar
3. **Test Individual Components**: Test setiap komponen secara terpisah
4. **Check Dependencies**: Pastikan semua dependencies terinstall

## 🔄 Continuous Testing

### Automated Testing

Setup automated testing untuk:
- Unit tests untuk compression functions
- Integration tests untuk API endpoints
- Performance tests untuk load testing
- Quality tests untuk image analysis

### Monitoring

Setup monitoring untuk:
- Error 413 occurrence
- Compression success rate
- Processing time
- Memory usage
- User experience metrics

---

**Status**: ✅ **TESTING GUIDE COMPLETE**

**Last Updated**: ${new Date().toLocaleString()}

**Version**: 1.0.0
