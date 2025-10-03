/**
 * Form validation utilities for MCP Hub Dashboard
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate server submission form
 */
export function validateServerSubmission(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Server name is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (data.name.length < 3) {
    errors.push({
      field: 'name',
      message: 'Server name must be at least 3 characters long',
      code: 'MIN_LENGTH',
    });
  } else if (data.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Server name must be 100 characters or less',
      code: 'MAX_LENGTH',
    });
  }

  // Description validation
  if (!data.description || typeof data.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (data.description.length < 10) {
    errors.push({
      field: 'description',
      message: 'Description must be at least 10 characters long',
      code: 'MIN_LENGTH',
    });
  } else if (data.description.length > 200) {
    errors.push({
      field: 'description',
      message: 'Description must be 200 characters or less',
      code: 'MAX_LENGTH',
    });
  }

  // URL validation
  if (!data.url || typeof data.url !== 'string') {
    errors.push({
      field: 'url',
      message: 'Server URL is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!isValidUrl(data.url)) {
    errors.push({
      field: 'url',
      message: 'Please enter a valid HTTPS URL',
      code: 'INVALID_URL',
    });
  }

  // Version validation
  if (!data.version || typeof data.version !== 'string') {
    errors.push({
      field: 'version',
      message: 'Version is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!isValidSemver(data.version)) {
    errors.push({
      field: 'version',
      message: 'Please enter a valid semantic version (e.g., 1.0.0)',
      code: 'INVALID_VERSION',
    });
  }

  // Tags validation
  if (!Array.isArray(data.tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array',
      code: 'INVALID_TYPE',
    });
  } else if (data.tags.length === 0) {
    errors.push({
      field: 'tags',
      message: 'At least one tag is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (data.tags.length > 10) {
    errors.push({
      field: 'tags',
      message: 'Maximum 10 tags allowed',
      code: 'MAX_ITEMS',
    });
  } else {
    // Validate individual tags
    data.tags.forEach((tag: any, index: number) => {
      if (typeof tag !== 'string') {
        errors.push({
          field: `tags[${index}]`,
          message: 'Each tag must be a string',
          code: 'INVALID_TYPE',
        });
      } else if (tag.length < 2) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Each tag must be at least 2 characters long',
          code: 'MIN_LENGTH',
        });
      } else if (tag.length > 20) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Each tag must be 20 characters or less',
          code: 'MAX_LENGTH',
        });
      } else if (!/^[a-z0-9-]+$/.test(tag)) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Tags can only contain lowercase letters, numbers, and hyphens',
          code: 'INVALID_FORMAT',
        });
      }
    });
  }

  // Author validation
  if (!data.author || typeof data.author !== 'object') {
    errors.push({
      field: 'author',
      message: 'Author information is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    if (!data.author.name || typeof data.author.name !== 'string') {
      errors.push({
        field: 'author.name',
        message: 'Author name is required',
        code: 'REQUIRED_FIELD',
      });
    } else if (data.author.name.length < 2) {
      errors.push({
        field: 'author.name',
        message: 'Author name must be at least 2 characters long',
        code: 'MIN_LENGTH',
      });
    } else if (data.author.name.length > 100) {
      errors.push({
        field: 'author.name',
        message: 'Author name must be 100 characters or less',
        code: 'MAX_LENGTH',
      });
    }

    if (data.author.url && !isValidUrl(data.author.url)) {
      errors.push({
        field: 'author.url',
        message: 'Please enter a valid URL',
        code: 'INVALID_URL',
      });
    }

    if (data.author.github && !isValidGitHubUsername(data.author.github)) {
      errors.push({
        field: 'author.github',
        message: 'Please enter a valid GitHub username',
        code: 'INVALID_GITHUB_USERNAME',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate semantic version format
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Validate GitHub username format
 */
export function isValidGitHubUsername(username: string): boolean {
  // GitHub username rules: 1-39 characters, alphanumeric or hyphens, cannot start/end with hyphen
  const githubUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  return githubUsernameRegex.test(username);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate and sanitize tag input
 */
export function validateTag(tag: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = tag.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  
  if (sanitized.length < 2) {
    return {
      valid: false,
      sanitized,
      error: 'Tag must be at least 2 characters long',
    };
  }
  
  if (sanitized.length > 20) {
    return {
      valid: false,
      sanitized: sanitized.substring(0, 20),
      error: 'Tag must be 20 characters or less',
    };
  }
  
  if (sanitized.startsWith('-') || sanitized.endsWith('-')) {
    return {
      valid: false,
      sanitized,
      error: 'Tag cannot start or end with a hyphen',
    };
  }
  
  return {
    valid: true,
    sanitized,
  };
}

/**
 * Get validation error message for a specific field
 */
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  const error = errors.find(e => e.field === field);
  return error?.message;
}

/**
 * Check if a field has validation errors
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(e => e.field === field);
}
