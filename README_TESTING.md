# Testing Error 413 Fix - Quick Start Guide

## 🚀 Quick Start

### 1. Simple Test (Recommended untuk pertama kali)

```bash
node test-simple.js
```

Test ini akan:
- ✅ Check compression module
- ✅ Test image validation
- ✅ Test image compression
- ✅ Test error handling
- ✅ Test file size limits

### 2. Comprehensive Testing

```bash
# Run all tests
node run-all-tests.js

# Or run individual test suites
node test-error-413-comprehensive.js
node test-image-quality.js
node test-error-handling.js
```

### 3. Frontend Testing

Buka `test-frontend-error-413.html` di browser untuk test UI functionality.

## 📊 Test Results

### Expected Results

**✅ All tests should pass:**
- Compression module loaded successfully
- Image validation working correctly
- Image compression working properly
- Error handling working as expected
- File size limits enforced correctly

### Success Criteria

1. **No Error 413**: Error 413 tidak terjadi lagi
2. **Compression Works**: Image compression bekerja dengan baik
3. **Quality Acceptable**: Kualitas image setelah compression masih bagus untuk print
4. **Error Handling**: Error handling bekerja dengan baik
5. **User Experience**: Loading states dan error messages jelas

## 🔧 Troubleshooting

### Common Issues

1. **Module Not Found**
   ```bash
   npm install sharp
   ```

2. **ES Module Errors**
   - Pastikan menggunakan `import` bukan `require`
   - Check `package.json` untuk `"type": "module"`

3. **Test Images Not Generated**
   - Check file permissions
   - Verify Sharp library installation

### Debug Steps

1. **Check Logs**: Periksa console logs untuk error messages
2. **Verify Configuration**: Pastikan semua konfigurasi benar
3. **Test Individual Components**: Test setiap komponen secara terpisah
4. **Check Dependencies**: Pastikan semua dependencies terinstall

## 📝 Test Files

| File | Purpose | Usage |
|------|---------|-------|
| `test-simple.js` | Quick test | `node test-simple.js` |
| `test-error-413-comprehensive.js` | Comprehensive tests | `node test-error-413-comprehensive.js` |
| `test-image-quality.js` | Quality tests | `node test-image-quality.js` |
| `test-error-handling.js` | Error handling tests | `node test-error-handling.js` |
| `test-frontend-error-413.html` | Frontend tests | Open in browser |
| `run-all-tests.js` | Master test runner | `node run-all-tests.js` |
| `test-detailed.js` | Detailed tests | `node test-detailed.js` |
| `test-individual.js` | Individual tests | `node test-individual.js <type>` |

## 🎯 Test Types

### Individual Test Types

```bash
node test-individual.js comprehensive
node test-individual.js quality
node test-individual.js error
node test-individual.js frontend
node test-individual.js integration
node test-individual.js performance
```

## 📈 Performance Benchmarks

| Image Size | Processing Time | Compression Ratio | Quality |
|------------|----------------|-------------------|---------|
| <500KB     | <200ms        | No compression    | Original |
| 1-2MB      | <1s           | 60-70%           | High    |
| 3-5MB      | <3s           | 70-80%           | Good    |
| >5MB       | Rejected      | N/A              | N/A     |

## 📋 Checklist

- [ ] Run simple test: `node test-simple.js`
- [ ] Run comprehensive tests: `node test-error-413-comprehensive.js`
- [ ] Run quality tests: `node test-image-quality.js`
- [ ] Run error handling tests: `node test-error-handling.js`
- [ ] Test frontend: Open `test-frontend-error-413.html`
- [ ] Run all tests: `node run-all-tests.js`
- [ ] Check test reports in `test-reports/` directory
- [ ] Verify all tests pass (100% success rate)
- [ ] Check performance within limits
- [ ] Verify error handling works correctly

## 🎉 Success!

Jika semua tests pass, maka:

✅ **Error 413 fix is working correctly**  
✅ **Image compression is working properly**  
✅ **Quality is acceptable for print**  
✅ **Error handling is robust**  
✅ **System is ready for production**

## 📞 Support

Jika ada masalah:

1. **Check Logs**: Periksa console logs untuk error messages
2. **Review Configuration**: Pastikan semua konfigurasi benar
3. **Test Individual Components**: Test setiap komponen secara terpisah
4. **Check Dependencies**: Pastikan semua dependencies terinstall

---

**Status**: ✅ **TESTING READY**

**Last Updated**: ${new Date().toLocaleString()}

**Version**: 1.0.0
