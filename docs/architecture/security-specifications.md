# BMad Link 安全控制规范

## 总体安全架构

### 威胁模型分析

**资产识别：**
- 用户书签数据（URL、标题、内容摘要）
- AI语义向量数据（用于搜索）
- 用户设备标识和认证令牌
- 搜索历史和行为数据

**威胁场景：**
1. **数据泄露**：敏感书签数据被窃取或意外泄露
2. **认证绕过**：攻击者冒充合法用户访问数据
3. **注入攻击**：XSS、CSRF等Web攻击向量
4. **中间人攻击**：云端同步时的数据传输被截获
5. **恶意扩展**：其他扩展试图访问BMad Link数据

### 安全设计原则

- **深度防御**：多层安全控制，单点失效不导致整体沦陷
- **最小权限**：仅申请必要的浏览器权限，严格控制数据访问
- **数据本地化**：敏感数据优先本地处理，减少云端攻击面
- **加密传输和存储**：所有敏感数据端到端加密保护
- **零信任架构**：不信任任何网络连接，全面验证和监控

## 认证和授权架构

### JWT令牌安全设计

**令牌结构和加密：**
```typescript
interface BMadJWTPayload {
  // 标准声明
  iss: 'bmad-link-api';                    // 签发者
  sub: string;                             // 用户UUID
  aud: 'bmad-link-extension';             // 受众
  exp: number;                            // 过期时间（1小时）
  iat: number;                            // 签发时间
  nbf: number;                            // 生效时间
  jti: string;                            // 令牌唯一ID
  
  // 自定义声明
  deviceId: string;                       // 设备指纹哈希
  authLevel: 'local' | 'cloud';          // 认证级别
  permissions: string[];                  // 权限列表
  sessionId: string;                     // 会话标识
  riskScore: number;                     // 风险评分 0-100
}

// 令牌加密配置
interface JWTSecurityConfig {
  algorithm: 'ES256';                    // ECDSA with P-256 and SHA-256
  keyRotationInterval: 86400;           // 24小时密钥轮换
  clockTolerance: 30;                   // 30秒时钟偏移容忍
  blacklistEnabled: true;               // 支持令牌黑名单
  refreshThreshold: 300;                // 5分钟刷新阈值
}
```

**密钥管理策略：**
- **签名密钥**：ECDSA P-256私钥，存储在Vercel KV加密区域
- **密钥轮换**：24小时自动轮换，保留前3个密钥用于验证
- **密钥派生**：使用HKDF从主密钥派生会话密钥
- **HSM保护**：生产环境使用硬件安全模块（AWS CloudHSM）

### 设备认证机制

**设备指纹增强算法：**
```typescript
interface DeviceFingerprint {
  // 核心标识符（稳定性极高）
  extensionId: string;                  // Chrome扩展UUID
  userAgent: string;                   // 完整User-Agent字符串
  
  // 环境特征（稳定性高）
  screenSignature: string;             // 屏幕分辨率+色深+比例
  timezoneInfo: string;               // 时区+DST状态
  languageSettings: string;           // 语言偏好列表
  
  // 硬件特征（稳定性中等）
  hardwareConcurrency: number;        // CPU核心数
  memoryInfo?: string;                // 内存信息（如果可用）
  platformDetails: string;           // 操作系统详细信息
  
  // 行为特征（稳定性低，用于异常检测）
  canvasFingerprint: string;          // Canvas渲染指纹
  audioFingerprint?: string;          // Web Audio API指纹
  fontList: string[];                // 系统字体列表
  
  // 安全增强
  entropy: string;                   // 随机熵值
  timestamp: number;                 // 生成时间戳
  version: string;                  // 指纹算法版本
}

// 指纹生成算法
class SecureDeviceFingerprinter {
  async generateFingerprint(): Promise<DeviceFingerprint> {
    const coreId = await this.generateCoreId();
    const environmentSig = await this.captureEnvironment();
    const hardwareFeatures = await this.detectHardware();
    const behavioralSigs = await this.captureBehavioral();
    
    return {
      ...coreId,
      ...environmentSig,
      ...hardwareFeatures,
      ...behavioralSigs,
      entropy: crypto.getRandomValues(new Uint8Array(16)).toString(),
      timestamp: Date.now(),
      version: '1.0'
    };
  }
  
  // 设备一致性验证（允许部分特征变化）
  verifyConsistency(stored: DeviceFingerprint, current: DeviceFingerprint): {
    isValid: boolean;
    confidence: number;
    changedFeatures: string[];
  } {
    const weights = {
      extensionId: 0.3,
      userAgent: 0.2,
      screenSignature: 0.15,
      timezoneInfo: 0.15,
      hardwareConcurrency: 0.1,
      platformDetails: 0.1
    };
    
    // 计算加权相似度分数
    let totalScore = 0;
    const changedFeatures: string[] = [];
    
    for (const [feature, weight] of Object.entries(weights)) {
      if (stored[feature] === current[feature]) {
        totalScore += weight;
      } else {
        changedFeatures.push(feature);
      }
    }
    
    return {
      isValid: totalScore >= 0.7, // 70%相似度阈值
      confidence: totalScore,
      changedFeatures
    };
  }
}
```

### 会话管理安全

**会话存储架构：**
```typescript
interface SecureSession {
  sessionId: string;                   // UUID v4会话标识
  userId: string;                     // 用户UUID
  deviceId: string;                   // 设备指纹哈希
  
  // 安全状态
  createdAt: number;                  // 创建时间戳
  lastActivity: number;               // 最后活跃时间
  expiresAt: number;                 // 过期时间（7天）
  
  // 环境信息
  ipAddress: string;                 // 加密存储的IP地址
  userAgent: string;                // 加密存储的UA
  location?: GeoLocation;           // 地理位置（如果启用）
  
  // 风险控制
  riskScore: number;                // 当前风险评分
  failedAttempts: number;           // 认证失败次数
  locked: boolean;                  // 会话锁定状态
  
  // 权限控制
  permissions: SessionPermissions;   // 会话级权限
  dataScope: DataAccessScope;       // 数据访问范围
}

// 会话安全策略
class SessionSecurityManager {
  // 会话创建时的安全检查
  async createSecureSession(deviceAuth: DeviceAuthentication): Promise<SecureSession> {
    const riskAssessment = await this.assessCreationRisk(deviceAuth);
    
    if (riskAssessment.score > 70) {
      throw new SecurityError('HIGH_RISK_SESSION', 'Session creation blocked due to high risk score');
    }
    
    const session: SecureSession = {
      sessionId: crypto.randomUUID(),
      userId: deviceAuth.userId,
      deviceId: deviceAuth.deviceId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天
      ipAddress: await this.encryptSensitiveData(deviceAuth.ipAddress),
      userAgent: await this.encryptSensitiveData(deviceAuth.userAgent),
      riskScore: riskAssessment.score,
      failedAttempts: 0,
      locked: false,
      permissions: this.calculateSessionPermissions(deviceAuth),
      dataScope: this.determineDataScope(deviceAuth)
    };
    
    // 存储到Redis，设置TTL
    await this.storeSession(session);
    return session;
  }
  
  // 会话验证和风险评估
  async validateSession(sessionId: string, currentContext: RequestContext): Promise<SessionValidation> {
    const session = await this.getSession(sessionId);
    
    if (!session || session.expiresAt < Date.now()) {
      return { valid: false, reason: 'SESSION_EXPIRED' };
    }
    
    // 环境一致性检查
    const environmentCheck = await this.verifyEnvironmentConsistency(session, currentContext);
    if (!environmentCheck.consistent) {
      await this.incrementRiskScore(session, 20);
      if (environmentCheck.severity === 'high') {
        await this.lockSession(session);
        return { valid: false, reason: 'ENVIRONMENT_MISMATCH' };
      }
    }
    
    // 更新活跃时间
    await this.updateLastActivity(session);
    
    return { valid: true, session, riskLevel: this.calculateRiskLevel(session) };
  }
}
```

## 数据加密和保护

### 端到端加密架构

**本地数据加密：**
```typescript
interface LocalEncryptionConfig {
  // 对称加密配置
  algorithm: 'AES-GCM';               // AES-256-GCM
  keyDerivation: 'PBKDF2';           // PBKDF2 with SHA-256
  iterations: 100000;                // PBKDF2迭代次数
  saltLength: 32;                    // 盐值长度（字节）
  ivLength: 12;                      // GCM初始向量长度
  
  // 数据分类加密
  bookmarkContent: 'HIGH';           // 高级别加密
  searchHistory: 'MEDIUM';           // 中级别加密
  uiPreferences: 'LOW';             // 低级别加密
}

class LocalDataEncryption {
  private masterKey: CryptoKey;
  private keyCache: Map<string, CryptoKey> = new Map();
  
  async initializeEncryption(deviceId: string): Promise<void> {
    // 从设备指纹派生主密钥
    const keyMaterial = await this.deriveKeyFromDevice(deviceId);
    this.masterKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  }
  
  async encryptSensitiveData(data: any, classification: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<EncryptedData> {
    const dataKey = await this.deriveDataKey(classification);
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      dataKey,
      plaintext
    );
    
    return {
      ciphertext: new Uint8Array(encrypted),
      iv,
      algorithm: 'AES-GCM',
      classification,
      timestamp: Date.now()
    };
  }
  
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<any> {
    const dataKey = await this.deriveDataKey(encryptedData.classification);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encryptedData.iv },
      dataKey,
      encryptedData.ciphertext
    );
    
    const plaintext = new TextDecoder().decode(decrypted);
    return JSON.parse(plaintext);
  }
  
  // 定期轮换数据密钥
  async rotateDataKeys(): Promise<void> {
    this.keyCache.clear();
    // 重新加密所有数据使用新密钥
    await this.reencryptStoredData();
  }
}
```

**传输加密保护：**
```typescript
interface TransportSecurity {
  // TLS配置
  minTLSVersion: '1.3';              // 最低TLS 1.3
  cipherSuites: string[];           // 允许的加密套件
  certificatePinning: boolean;      // 证书锁定
  
  // API请求加密
  requestEncryption: 'JWE';         // JWE加密请求体
  responseEncryption: 'JWE';        // JWE加密响应体
  keyAgreement: 'ECDH-ES';         // 密钥协商算法
}

class APISecurityLayer {
  async secureAPIRequest(endpoint: string, payload: any): Promise<SecureResponse> {
    // 1. 生成临时密钥对
    const ephemeralKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
    );
    
    // 2. 与服务端进行密钥协商
    const sharedKey = await this.performKeyAgreement(ephemeralKeyPair);
    
    // 3. 加密请求载荷
    const encryptedPayload = await this.encryptWithJWE(payload, sharedKey);
    
    // 4. 添加认证和完整性保护
    const authenticatedRequest = await this.signRequest(encryptedPayload);
    
    // 5. 发送请求并解密响应
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/jose',
        'Authorization': `Bearer ${await this.getAccessToken()}`,
        'X-Request-ID': crypto.randomUUID(),
        'X-Timestamp': Date.now().toString()
      },
      body: authenticatedRequest
    });
    
    return await this.decryptResponse(response, sharedKey);
  }
}
```

## 输入验证和输出编码

### XSS防护机制

**内容安全策略（CSP）：**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; base-uri 'none';",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' https://cdn.jsdelivr.net/npm/@tensorflow/tfjs*; object-src 'none';"
  }
}
```

**输入验证和净化：**
```typescript
interface InputValidationConfig {
  maxBookmarkTitleLength: 200;       // 标题最大长度
  maxDescriptionLength: 1000;        // 描述最大长度
  maxTagsCount: 10;                  // 最大标签数
  allowedURLProtocols: ['https:', 'http:', 'ftp:', 'file:'];
  forbiddenPatterns: RegExp[];       // 禁止的模式
}

class InputSanitizer {
  private domPurify: DOMPurify;
  private validator: Validator;
  
  async sanitizeBookmarkData(rawData: any): Promise<SanitizedBookmark> {
    // 1. 结构验证
    const validationResult = this.validator.validate(rawData, BookmarkSchema);
    if (!validationResult.valid) {
      throw new ValidationError('INVALID_BOOKMARK_STRUCTURE', validationResult.errors);
    }
    
    // 2. 内容净化
    const sanitized: SanitizedBookmark = {
      url: this.sanitizeURL(rawData.url),
      title: this.domPurify.sanitize(rawData.title, { ALLOWED_TAGS: [] }),
      description: this.sanitizeDescription(rawData.description),
      tags: rawData.tags?.map(tag => this.sanitizeTag(tag)) || [],
      content: this.sanitizeContent(rawData.content)
    };
    
    // 3. 恶意内容检测
    await this.detectMaliciousContent(sanitized);
    
    return sanitized;
  }
  
  private sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      
      // 检查协议白名单
      if (!this.config.allowedURLProtocols.includes(parsed.protocol)) {
        throw new ValidationError('INVALID_URL_PROTOCOL', `Protocol ${parsed.protocol} not allowed`);
      }
      
      // 移除危险参数
      this.removeDangerousParams(parsed);
      
      return parsed.toString();
    } catch (error) {
      throw new ValidationError('INVALID_URL_FORMAT', 'URL格式无效');
    }
  }
  
  private async detectMaliciousContent(data: SanitizedBookmark): Promise<void> {
    const suspiciousPatterns = [
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<script/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi
    ];
    
    const allText = `${data.title} ${data.description} ${data.content}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(allText)) {
        await this.logSecurityIncident('MALICIOUS_CONTENT_DETECTED', {
          pattern: pattern.source,
          content: allText.substring(0, 100)
        });
        throw new SecurityError('MALICIOUS_CONTENT', '检测到可疑内容');
      }
    }
  }
}
```

## API安全防护

### 认证和授权中间件

```typescript
class APISecurityMiddleware {
  async authenticateRequest(req: Request): Promise<AuthenticationResult> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { success: false, error: 'MISSING_TOKEN' };
    }
    
    const token = authHeader.slice(7);
    
    try {
      // 1. JWT令牌验证
      const payload = await this.verifyJWT(token);
      
      // 2. 会话状态检查
      const session = await this.validateSession(payload.sessionId);
      if (!session.valid) {
        return { success: false, error: 'INVALID_SESSION' };
      }
      
      // 3. 设备一致性验证
      const deviceCheck = await this.verifyDevice(payload.deviceId, req);
      if (!deviceCheck.consistent) {
        await this.logSecurityEvent('DEVICE_MISMATCH', { userId: payload.sub, deviceId: payload.deviceId });
        return { success: false, error: 'DEVICE_VERIFICATION_FAILED' };
      }
      
      // 4. 权限检查
      const permission = this.extractRequiredPermission(req);
      if (!this.hasPermission(payload.permissions, permission)) {
        return { success: false, error: 'INSUFFICIENT_PERMISSIONS' };
      }
      
      return {
        success: true,
        user: payload,
        session: session.session
      };
      
    } catch (error) {
      await this.logSecurityEvent('AUTH_ERROR', { error: error.message });
      return { success: false, error: 'AUTHENTICATION_FAILED' };
    }
  }
}
```

### CSRF防护

```typescript
class CSRFProtection {
  private tokenCache = new Map<string, CSRFToken>();
  
  async generateCSRFToken(sessionId: string): Promise<string> {
    const token: CSRFToken = {
      value: crypto.randomUUID(),
      sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30分钟
      used: false
    };
    
    this.tokenCache.set(token.value, token);
    
    // 定期清理过期令牌
    this.scheduleTokenCleanup(token.expiresAt);
    
    return token.value;
  }
  
  async validateCSRFToken(tokenValue: string, sessionId: string): Promise<boolean> {
    const token = this.tokenCache.get(tokenValue);
    
    if (!token || token.used || token.expiresAt < Date.now()) {
      return false;
    }
    
    if (token.sessionId !== sessionId) {
      await this.logSecurityEvent('CSRF_ATTACK_ATTEMPT', {
        expectedSession: token.sessionId,
        actualSession: sessionId
      });
      return false;
    }
    
    // 标记令牌为已使用（一次性）
    token.used = true;
    
    return true;
  }
}
```

## 安全监控和事件响应

### 安全事件日志

```typescript
interface SecurityEvent {
  eventId: string;                   // 事件唯一标识
  eventType: SecurityEventType;      // 事件类型
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;                // 事件时间戳
  
  // 用户和会话信息
  userId?: string;                  // 用户标识
  sessionId?: string;               // 会话标识
  deviceId?: string;                // 设备标识
  
  // 请求信息
  ipAddress?: string;               // 客户端IP（加密存储）
  userAgent?: string;               // User-Agent（加密存储）
  endpoint?: string;                // 访问的端点
  
  // 事件详情
  description: string;              // 事件描述
  metadata: Record<string, any>;    // 额外元数据
  
  // 响应信息
  actionTaken?: string;             // 已采取的行动
  resolved: boolean;                // 是否已解决
}

class SecurityMonitor {
  async logSecurityEvent(event: Omit<SecurityEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      timestamp: Date.now(),
      resolved: false
    };
    
    // 持久化事件日志
    await this.persistEvent(fullEvent);
    
    // 实时告警处理
    await this.processAlert(fullEvent);
    
    // 自动响应处理
    await this.autoRespond(fullEvent);
  }
  
  private async autoRespond(event: SecurityEvent): Promise<void> {
    switch (event.eventType) {
      case 'MULTIPLE_FAILED_LOGINS':
        if (event.severity === 'HIGH') {
          await this.temporaryLockAccount(event.userId!, 15 * 60 * 1000); // 15分钟
        }
        break;
        
      case 'SUSPICIOUS_DEVICE_ACCESS':
        await this.requireAdditionalVerification(event.sessionId!);
        break;
        
      case 'POTENTIAL_DATA_BREACH':
        if (event.severity === 'CRITICAL') {
          await this.emergencyLockdown(event.userId!);
          await this.notifySecurityTeam(event);
        }
        break;
        
      case 'MALICIOUS_CONTENT_UPLOAD':
        await this.quarantineContent(event.metadata.contentId);
        break;
    }
  }
  
  // 异常检测算法
  async detectAnomalies(userId: string): Promise<AnomalyDetectionResult> {
    const recentEvents = await this.getRecentEvents(userId, 24 * 60 * 60 * 1000); // 24小时
    
    const anomalies: Anomaly[] = [];
    
    // 1. 频率异常检测
    const requestFrequency = this.analyzeRequestFrequency(recentEvents);
    if (requestFrequency.score > 0.8) {
      anomalies.push({
        type: 'UNUSUAL_REQUEST_FREQUENCY',
        score: requestFrequency.score,
        description: `请求频率异常：${requestFrequency.rpm} RPM`
      });
    }
    
    // 2. 地理位置异常
    const locationAnomaly = await this.analyzeLocationPattern(recentEvents);
    if (locationAnomaly.score > 0.7) {
      anomalies.push({
        type: 'LOCATION_ANOMALY',
        score: locationAnomaly.score,
        description: `检测到异常登录位置：${locationAnomaly.location}`
      });
    }
    
    // 3. 设备行为异常
    const behaviorAnomaly = this.analyzeBehaviorPattern(recentEvents);
    if (behaviorAnomaly.score > 0.6) {
      anomalies.push({
        type: 'BEHAVIOR_ANOMALY',
        score: behaviorAnomaly.score,
        description: `用户行为模式异常`
      });
    }
    
    return {
      userId,
      timestamp: Date.now(),
      anomalies,
      overallRiskScore: Math.max(...anomalies.map(a => a.score), 0)
    };
  }
}
```

## 漏洞管理和安全测试

### 自动化安全扫描

```typescript
interface SecurityScanConfig {
  // 静态代码分析
  staticAnalysis: {
    tools: ['ESLint Security', 'Semgrep', 'CodeQL'];
    rulesets: ['OWASP Top 10', 'CWE Top 25'];
    scanFrequency: 'on-commit';
  };
  
  // 依赖漏洞扫描
  dependencyScanning: {
    tools: ['npm audit', 'Snyk', 'WhiteSource'];
    severityThreshold: 'medium';
    autoUpdate: 'patch-only';
  };
  
  // 运行时安全测试
  dynamicTesting: {
    tools: ['OWASP ZAP', 'Burp Suite'];
    testEnvironments: ['staging'];
    automatedScans: true;
  };
}

class SecurityScanner {
  async performSecurityScan(): Promise<SecurityScanReport> {
    const results = await Promise.allSettled([
      this.runStaticAnalysis(),
      this.runDependencyAudit(),
      this.runDynamicTests(),
      this.runPenetrationTests()
    ]);
    
    const report: SecurityScanReport = {
      scanId: crypto.randomUUID(),
      timestamp: Date.now(),
      results: results.map((result, index) => ({
        testType: ['static', 'dependency', 'dynamic', 'penetration'][index],
        status: result.status,
        findings: result.status === 'fulfilled' ? result.value : [],
        error: result.status === 'rejected' ? result.reason : null
      })),
      overallScore: this.calculateSecurityScore(results),
      recommendations: this.generateRecommendations(results)
    };
    
    // 自动创建安全问题工单
    await this.createSecurityIssues(report);
    
    return report;
  }
  
  private async runPenetrationTests(): Promise<PenTestFinding[]> {
    const tests = [
      this.testAuthenticationBypass,
      this.testSessionManagement,
      this.testInputValidation,
      this.testAccessControl,
      this.testDataEncryption,
      this.testCSRFProtection
    ];
    
    const findings: PenTestFinding[] = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result.vulnerabilities.length > 0) {
          findings.push(...result.vulnerabilities);
        }
      } catch (error) {
        findings.push({
          type: 'TEST_FAILURE',
          severity: 'MEDIUM',
          description: `渗透测试失败: ${error.message}`,
          remediation: '检查测试环境和配置'
        });
      }
    }
    
    return findings;
  }
}
```

这个安全控制规范涵盖了：
1. **完整的威胁模型分析**
2. **详细的认证和授权机制**
3. **端到端的数据加密方案**
4. **全面的输入验证和XSS防护**
5. **robust的API安全防护**
6. **实时安全监控和事件响应**
7. **自动化安全测试和漏洞管理**

这应该能够满足你作为白帽安全专家的严格安全要求。接下来我继续解决第2个问题。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u5b9a\u4e49\u8be6\u7ec6\u7684\u5b89\u5168\u63a7\u5236\u89c4\u8303", "status": "completed", "activeForm": "\u6b63\u5728\u5b9a\u4e49\u8be6\u7ec6\u7684\u5b89\u5168\u63a7\u5236\u89c4\u8303"}, {"content": "\u5efa\u7acb\u9519\u8bef\u76d1\u63a7\u548c\u65e5\u5fd7\u7cfb\u7edf", "status": "in_progress", "activeForm": "\u5efa\u7acb\u9519\u8bef\u76d1\u63a7\u548c\u65e5\u5fd7\u7cfb\u7edf"}, {"content": "\u5b8c\u5584\u7ec4\u4ef6\u63a5\u53e3\u5951\u7ea6", "status": "pending", "activeForm": "\u5b8c\u5584\u7ec4\u4ef6\u63a5\u53e3\u5951\u7ea6"}, {"content": "\u5236\u5b9a\u7f16\u7801\u6807\u51c6\u6587\u6863", "status": "pending", "activeForm": "\u5236\u5b9a\u7f16\u7801\u6807\u51c6\u6587\u6863"}, {"content": "\u8bbe\u8ba1\u51b2\u7a81\u89e3\u51b3\u7528\u6237\u6d41\u7a0b", "status": "pending", "activeForm": "\u8bbe\u8ba1\u51b2\u7a81\u89e3\u51b3\u7528\u6237\u6d41\u7a0b"}, {"content": "\u9a8c\u8bc1TensorFlow.js\u6027\u80fd\u5047\u8bbe", "status": "pending", "activeForm": "\u9a8c\u8bc1TensorFlow.js\u6027\u80fd\u5047\u8bbe"}, {"content": "\u5b9a\u4e49Chrome\u6269\u5c55CSP\u7b56\u7565", "status": "pending", "activeForm": "\u5b9a\u4e49Chrome\u6269\u5c55CSP\u7b56\u7565"}, {"content": "\u5efa\u7acb\u53ef\u8bbf\u95ee\u6027\u5b9e\u73b0\u8ba1\u5212", "status": "pending", "activeForm": "\u5efa\u7acb\u53ef\u8bbf\u95ee\u6027\u5b9e\u73b0\u8ba1\u5212"}, {"content": "\u5b8c\u5584API\u9519\u8bef\u5904\u7406\u673a\u5236", "status": "pending", "activeForm": "\u5b8c\u5584API\u9519\u8bef\u5904\u7406\u673a\u5236"}, {"content": "\u8bbe\u8ba1\u6570\u636e\u8fc1\u79fb\u7b56\u7565", "status": "pending", "activeForm": "\u8bbe\u8ba1\u6570\u636e\u8fc1\u79fb\u7b56\u7565"}, {"content": "\u5b9a\u4e49\u4f9d\u8d56\u7ba1\u7406\u7b56\u7565", "status": "pending", "activeForm": "\u5b9a\u4e49\u4f9d\u8d56\u7ba1\u7406\u7b56\u7565"}, {"content": "\u5efa\u7acb\u6027\u80fd\u57fa\u51c6\u548c\u76d1\u63a7", "status": "pending", "activeForm": "\u5efa\u7acb\u6027\u80fd\u57fa\u51c6\u548c\u76d1\u63a7"}, {"content": "\u5b8c\u5584\u6d4b\u8bd5\u7b56\u7565\u7ec6\u8282", "status": "pending", "activeForm": "\u5b8c\u5584\u6d4b\u8bd5\u7b56\u7565\u7ec6\u8282"}, {"content": "\u5236\u5b9a\u90e8\u7f72\u548c\u56de\u6eda\u7a0b\u5e8f", "status": "pending", "activeForm": "\u5236\u5b9a\u90e8\u7f72\u548c\u56de\u6eda\u7a0b\u5e8f"}]