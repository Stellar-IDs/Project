# Stellar Identity & Authentication Suite

## Repo 1: stellar-id-core
## Description
Core Soroban identity contract implementing decentralized identifiers (DIDs) on Stellar. Provides standard methods for creating, resolving, and updating Stellar-based DIDs with cryptographic verification. This contract serves as the foundational identity layer for the Stellar ecosystem, enabling decentralized identity management that works across applications and wallets. It implements the W3C DID method for Stellar, providing a standard way to create, manage, and verify decentralized identities on-chain.

## Repo Details
This repository contains the Soroban smart contract that implements decentralized identity on the Stellar network. The contract handles DID document creation, resolution, and updates following the W3C DID specification adapted for Stellar's architecture. Key capabilities include generating DID documents with verification methods, managing service endpoints, and supporting verifiable credentials. The contract is designed for gas efficiency and uses Stellar's native token (XLM) for any state-changing operations. It includes comprehensive test coverage and is designed to be extended by other projects needing identity functionality. The contract supports integration with Soroban wallets and can be used as a building block for broader authentication and authorization systems in the Stellar ecosystem.
## Key Features
- Soroban contract for DID creation and management
- Verifiable credentials support
- Revocation mechanism
- Cross-app identity continuity

## Contribution Issues for Wave
- Issue #1: Add DID method registration (4 points)
- Issue #2: Implement credential proof verification (3 points)
- Issue #3: Add revocation list support (3 points)
- Issue #4: Gas optimization for contract storage (2 points)

---

## Repo 2: stellar-id-client
## Description
TypeScript/JavaScript SDK for developers to integrate Stellar identity into applications. Handles key derivation, transaction signing, and DID resolution abstraction. This SDK provides a developer-friendly way to work with Stellar decentralized identities in web2 and web3 applications. It abstracts away the complexity of XDR operations and Soroban contract interactions, providing simple JavaScript/TypeScript functions for common identity operations. The SDK supports multiple wallet integrations, including Soroban wallets, and provides type-safe interactions with the identity contract. It includes utilities for did:stellar method resolution, credential verification, and session management. The SDK is designed to be framework-agnostic and works with React, Vue, Angular, or plain JavaScript projects.

## Repo Details
This TypeScript/JavaScript SDK serves as the primary interface for developers integrating Stellar decentralized identity into their applications. The package provides comprehensive type definitions and utilities for working with did:stellar identities. It handles the complex cryptographic operations needed for DID document creation and verification, allowing developers to focus on user experience. The SDK includes adapters for popular wallet connectors (Soroban wallet, XLMbase, etc.) and provides fallback mechanisms for different environments. It's fully typed with TypeScript, includes JSDoc documentation, and is published as an npm package for easy integration. The repository also contains example projects demonstrating usage in React, Vue, and Node.js environments, along with comprehensive tests covering all public APIs.
## Key Features
- TypeScript types for all identity operations
- Wallet integration (Soroban wallet, XDR-based auth)
- Resolver for Stellar DNS and on-chain DIDs
- Simple API: `createIdentity()`, `resolveIdentity()`, `verifyCredential()`

## Contribution Issues for Wave
- Issue #1: Add TypeScript types for new DID methods (3 points)
- Issue #2: Implement wallet connector integration (3 points)
- Issue #3: Add resolver fallback logic (2 points)
- Issue #4: Write comprehensive documentation (2 points)

---

## Repo 3: stellar-id-frontend
## Description
React/Next.js components and hooks for building identity-aware frontend applications. Pre-built UI components for login, profile management, and credential presentation. This repository provides a complete set of ready-to-use React components and hooks that abstract away the complexity of integrating Stellar identity into frontend applications. The components handle authentication flows, profile display, credential verification, and session management while maintaining a clean, accessible UI. Built with accessibility (WCAG) in mind, the components work with popular UI component libraries (Tailwind, Chakra, Material-UI) and are fully typed in TypeScript. The repository includes theming support, responsive design, and comprehensive documentation for customization.

## Repo Details
This React/Next.js component library provides the frontend building blocks for identity-aware applications. The package includes over a dozen pre-built components such as IdentityLogin, IdentityProfile, CredentialBadge, and SessionProvider. Each component is fully typed in TypeScript and comes with default styling that can be easily customized via CSS variables or theme providers. The library handles the complex state management of identity sessions, automatically refreshing DID documents and verifying credentials on the Stellar network. It includes hooks useIdentity, useDidDocument, and useCredential that simplify integration into any React component. The repository also provides a higher-order component withAuth for protecting routes and a custom hook useIdentityStatus for tracking authentication state. Comprehensive Storybook demonstrations and accessibility tests are included to ensure quality across different use cases.
## Key Features
- Ready-to-use auth login component
- Profile display with credential badges
- Session management hooks
- WCAG-accessible components

## Contribution Issues for Wave
- Issue #1: Add social login fallback (3 points)
- Issue #2: Implement profile editing UI (3 points)
- Issue #3: Add theme customization (2 points)
- Issue #4: Write accessibility audit (2 points)

---

## Repo 4: stellar-id-docs (optional for 4x multiplier)
## Description
 comprehensive integration guides, API references, and example projects showing how to use the identity suite across different frameworks. This documentation repository serves as the central knowledge base for the Stellar Identity Suite, providing developers with the resources needed to integrate decentralized identity into their projects. The documentation covers quick-start guides, detailed API references, migration patterns from traditional authentication systems, and best practices for security and user experience. Content is organized by framework (React, Vue, Svelte, Node.js) and includes full-stack examples connecting frontend interfaces with the Soroban identity contract and backend services. The repository is community-driven with contribution guidelines for adding new framework support, updating examples for Soroban protocol changes, and translating documentation into multiple languages. All content is reviewed and tested against the latest Soroban contract version.

## Repo Details
The documentation repository contains over 50 comprehensive guides covering every aspect of the Stellar Identity Suite. The Quick-Start Guides section provides 5-minute integration examples for the most common use cases. The API Reference documents all contract methods, SDK functions, and their parameters with TypeScript signatures. Framework Guides walk through integration step-by-step for React, Vue, Svelte, and Angular applications, including Vite and CRA setup. Full-Stack Examples include complete projects demonstrating authentication flows from login to profile management. The Best Practices section covers security considerations, gas optimization, and user experience patterns. Each document includes version compatibility information, migration guides when contract APIs change, and links to related resources. The repository uses a custom documentation generator that converts Markdown to interactive web help, with search functionality and version selectors.
## Key Features
- Quick-start guides for React, Vue, and Svelte
- Full-stack example (frontend + backend + contract)
- Migration guide from traditional auth
- Best practices and security guidelines

## Contribution Issues for Wave
- Issue #1: Add React integration guide (3 points)
- Issue #2: Add Vue integration guide (3 points)
- Issue #3: Create full-stack example (4 points)
- Issue #4: Write security best practices (2 points)