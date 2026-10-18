import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // 仓库当前暂无测试文件，避免 `vitest run` 以“No test files found”退出码 1 失败
        passWithNoTests: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },
    root: path.resolve('./'),
})
