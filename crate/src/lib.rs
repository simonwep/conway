extern crate js_sys;

use wasm_bindgen::prelude::*;

mod utils;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
// Taken from https://github.com/rustwasm/wasm-pack-template/blob/master/src/lib.rs
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Universe {
    cols: usize,
    rows: usize,
    source: Vec<u8>,
    target: Vec<u8>,
    swap: bool,
}

#[wasm_bindgen]
impl Universe {
    /// Creates a new game-of-life universe
    pub fn new(cols: usize, rows: usize) -> Universe {
        // Pad universe left and right, thus we don't need to
        // check corners.
        let total_cells = cols * rows + rows * 2 + cols * 2;
        let target: Vec<u8> = (0..total_cells).map(|_| 0).collect();
        let source: Vec<u8> = (0..total_cells)
            .map(|i| if js_sys::Math::random() > 0.75 { 1 } else { 0 })
            .collect();

        Universe {
            swap: false,
            cols,
            rows,
            source,
            target,
        }
    }

    /// Returns the current cell-list
    pub fn cells(&self) -> *const u8 {
        if self.swap {
            self.source.as_ptr()
        } else {
            self.target.as_ptr()
        }
    }

    /// Calculates the next generation
    pub fn next_gen(&mut self) {
        let (src, tar) = if self.swap {
            (&mut self.target, &mut self.source)
        } else {
            (&mut self.source, &mut self.target)
        };

        for row in 1..self.rows {
            let offset = row * self.cols;
            let top = (row - 1) * self.cols;
            let bottom = (row + 1) * self.cols;

            for col in 1..self.cols {
                let cell_offset = offset + col;
                let bottom_offset = bottom + col;
                let top_offset = top + col;

                let neighbors = src[top_offset - 1] + // Top Left
                    src[top_offset] + // Top Middle
                    src[top_offset + 1] + // Top Right
                    src[cell_offset - 1] + // Left
                    src[cell_offset + 1] + // Right
                    src[bottom_offset - 1] + // Bottom Left
                    src[bottom_offset] + // Bottom Middle
                    src[bottom_offset + 1]; // Bottom Right

                let next_cell = if src[cell_offset] == 1 {
                    // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                    // Any live cell with two or three live neighbours lives on to the next generation.
                    // Any live cell with more than three live neighbours dies, as if by overpopulation.
                    (neighbors < 4 && neighbors > 1)
                } else {
                    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    neighbors == 3
                };

                tar[cell_offset] = if next_cell { 1 } else { 0 }
            }
        }

        self.swap = !self.swap;
    }
}
