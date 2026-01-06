export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

4. Click **Commit changes**

---

### **2.4 Add `.gitignore`**

1. Click **Add file** → **Create new file**
2. Name it: `.gitignore`
3. Copy and paste:
```
node_modules/
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
build/
.DS_Store
.vercel
