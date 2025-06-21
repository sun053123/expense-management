# Template Usage Guide
*How to use the comprehensive prompt template system for consistent AI prompt engineering*

---

## 📁 Template Overview

This template system provides a standardized approach to creating AI prompts across all your projects. Each numbered template serves a specific purpose and can be customized for your project needs.

### Template Files Structure

```
template/
├── 00_template_usage_guide.md          # This guide
├── 01_system_prompt.txt                # Original example (reference)
├── 02_comprehensive_system_prompt.txt  # Main AI assistant prompt
├── 03_base_knowledge_template.txt      # Project/domain knowledge base
├── 04_style_guide_template.txt         # Coding standards and patterns
├── 05_tool_chain_guide_template.txt    # Tool usage workflows
├── 06_test_cases_template.txt          # Testing strategies and cases
└── 07_resource_local_template.txt      # Local development resources
```

---

## 🎯 Quick Start Guide

### 1. Choose Your Starting Point

#### **For New Projects (5-minute setup):**
1. Copy `02_comprehensive_system_prompt.txt`
2. Replace key placeholders: `[PROJECT_NAME]`, `[ROLE_TITLE]`, `[PRIMARY_DOMAIN]`
3. Select relevant tools from the MCP tools list
4. Set communication style and experience level
5. Add your resource URLs

#### **For Existing Projects (15-minute setup):**
1. Use all templates 02-07 as a complete system
2. Customize each template systematically
3. Follow the detailed customization instructions in each file
4. Test with simple tasks before full deployment

#### **For Enterprise Projects (30-minute setup):**
1. Complete full customization of all templates
2. Add compliance and security requirements
3. Integrate with team workflows and tools
4. Create project-specific validation criteria

---

## 📋 Template-by-Template Guide

### 02_comprehensive_system_prompt.txt
**Purpose:** Main AI assistant configuration and persona
**When to Use:** Every project - this is your primary prompt template
**Key Customizations:**
- Replace `[PROJECT_NAME]` and `[MICROSERVICE_NAME]`
- Set `[ROLE_TITLE]` and expertise level
- Choose relevant MCP tools
- Configure response formats for your workflow
- Set quality standards and communication style

**Example Usage:**
```
Project Name: E-commerce Platform → Customer Data Platform
Role Title: Backend Developer → Senior Full-stack Developer
Primary Domain: Web Development → Microservices Architecture
```

### 03_base_knowledge_template.txt
**Purpose:** Project and domain-specific knowledge base
**When to Use:** When you need the AI to understand your specific business context
**Key Customizations:**
- Define business context and technical purpose
- List key features and architecture components
- Document main workflows and data flows
- Specify technology stack and dependencies

**Example Usage:**
```
Business Context: E-commerce platform → Customer data management system
Technical Purpose: Product catalog → Customer profile aggregation
Architecture: Monolith → Microservices with clean architecture
```

### 04_style_guide_template.txt
**Purpose:** Coding standards, patterns, and conventions
**When to Use:** When you want consistent code generation following your team's standards
**Key Customizations:**
- Define naming conventions for your language/framework
- Add code pattern examples from your codebase
- Specify error handling and testing patterns
- Include common libraries and best practices

**Example Usage:**
```
Programming Language: Python → Go
Naming Convention: snake_case → camelCase
Framework: Django → Gin HTTP Framework
Error Pattern: try/except → error return values
```

### 05_tool_chain_guide_template.txt
**Purpose:** Workflow guidance for using MCP tools effectively
**When to Use:** When you want structured, repeatable development workflows
**Key Customizations:**
- Define your development phases and tool chains
- Add domain-specific workflows
- Include troubleshooting patterns
- Specify tool combinations for different tasks

**Example Usage:**
```
Development Tool 1: artifacts → str_replace_editor
Testing Approach: pytest → go test
Validation Method: manual testing → automated integration tests
```

### 06_test_cases_template.txt
**Purpose:** Testing strategy and test case management
**When to Use:** When you need comprehensive testing guidance and test data management
**Key Customizations:**
- Define test data sources and access methods
- Specify test categories and coverage requirements
- Add test execution commands for your stack
- Include performance and security test cases

**Example Usage:**
```
Database Type: MongoDB → PostgreSQL
Test Table Name: test_data → test_cases
Programming Language: JavaScript → Go
Test Command: npm test → go test ./...
```

### 07_resource_local_template.txt
**Purpose:** Local development environment and resource locations
**When to Use:** When you want the AI to understand your local setup and file locations
**Key Customizations:**
- Add your actual repository paths
- Include local service configurations
- Specify development tools and scripts
- Document environment setup requirements

**Example Usage:**
```
Primary Repo Local Path: /Users/dev/projects/app → /Users/dev/workspace/customer-platform/service
Database 1 Type: MySQL → PostgreSQL
IDE Name: IntelliJ → VS Code
```

---

## 🔧 Customization Strategies

### Level 1: Basic Customization (5 minutes)
**Use Template:** 02_comprehensive_system_prompt.txt only
**Replace:**
- `[PROJECT_NAME]` → Your project name
- `[ROLE_TITLE]` → Your desired AI role
- `[PRIMARY_DOMAIN]` → Your technical domain
- Select 5-8 relevant MCP tools
- Set communication style

### Level 2: Standard Customization (15 minutes)
**Use Templates:** 02, 03, 04
**Additional Steps:**
- Complete business context in template 03
- Add coding patterns from your codebase in template 04
- Configure quality standards and workflows
- Test with a simple development task

### Level 3: Complete Customization (30 minutes)
**Use Templates:** 02, 03, 04, 05, 06, 07
**Additional Steps:**
- Define comprehensive workflows in template 05
- Set up testing strategy in template 06
- Document local environment in template 07
- Create team-specific validation criteria
- Test with complex, multi-step tasks

---

## 🎨 Customization Examples by Domain

### Web Development Project
```yaml
Project Type: web-app
Primary Domain: full-stack development
Key Tools: [codebase_retrieval, str_replace_editor, launch_process, web_search]
Communication Style: professional
Architecture: MVC or component-based
Testing: Jest/Cypress or similar
```

### Data Science Project
```yaml
Project Type: data-pipeline
Primary Domain: machine learning
Key Tools: [RAG_memory_*, web_search, execute_command_line_script]
Communication Style: technical
Architecture: ETL pipeline
Testing: pytest with data validation
```

### DevOps/Infrastructure Project
```yaml
Project Type: automation
Primary Domain: cloud infrastructure
Key Tools: [execute_command_line_script, gitlab_*, confluence_*]
Communication Style: technical
Architecture: Infrastructure as Code
Testing: Terraform plan/apply validation
```

### Mobile Development Project
```yaml
Project Type: mobile-app
Primary Domain: mobile development
Key Tools: [codebase_retrieval, str_replace_editor, diagnostics]
Communication Style: professional
Architecture: MVVM or Clean Architecture
Testing: XCTest/Espresso
```

---

## ✅ Validation Checklist

### Before Using Your Templates
- [ ] All `[PLACEHOLDER_TEXT]` replaced with actual values
- [ ] Tool list matches your available MCP integrations
- [ ] Communication style fits your team culture
- [ ] Response formats align with your workflow
- [ ] Quality standards are realistic and measurable
- [ ] Resource URLs are accessible and current
- [ ] Local paths exist and are correct

### After Initial Setup
- [ ] Test with a simple task (e.g., "explain this code file")
- [ ] Test with a medium task (e.g., "implement a new feature")
- [ ] Gather feedback from team members
- [ ] Adjust detail levels based on usage
- [ ] Refine tool selection based on actual needs

---

## 🔄 Template Evolution

### Regular Maintenance
- **Weekly:** Collect feedback during team meetings
- **Monthly:** Review template effectiveness
- **Quarterly:** Update for new tools or processes
- **Annually:** Major template overhaul

### Version Control
- Keep templates in version control
- Document changes and rationale
- Create migration guides for major updates
- Maintain backward compatibility when possible

---

## 🚀 Advanced Usage Patterns

### Multi-Project Templates
Create project-specific variants:
```
template/
├── 02_web_app_system_prompt.txt
├── 02_api_service_system_prompt.txt
├── 02_data_pipeline_system_prompt.txt
```

### Team-Specific Templates
Create role-specific variants:
```
template/
├── 02_senior_dev_system_prompt.txt
├── 02_junior_dev_system_prompt.txt
├── 02_architect_system_prompt.txt
```

### Environment-Specific Templates
Create environment variants:
```
template/
├── 07_local_dev_resources.txt
├── 07_staging_resources.txt
├── 07_production_resources.txt
```

---

## 💡 Tips for Success

1. **Start Simple:** Begin with basic customization and evolve over time
2. **Test Early:** Validate templates with real tasks before full adoption
3. **Gather Feedback:** Regularly collect input from team members
4. **Document Changes:** Keep track of what works and what doesn't
5. **Stay Consistent:** Use the same template structure across projects
6. **Iterate Frequently:** Refine based on actual usage patterns

---

*This template system is designed to grow with your needs. Start with what you need today and expand as your requirements evolve.*
