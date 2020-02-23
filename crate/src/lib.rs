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
    source: Vec<bool>,
    target: Vec<bool>,
    updated_cells: Vec<(usize, usize, usize)>,
    update_count: usize,
    swap: bool,
}

#[wasm_bindgen]
impl Universe {
    /// Creates a new game-of-life universe
    pub fn new(cols: usize, rows: usize) -> Universe {
        // Pad universe left and right, thus we don't need to
        // check corners.
        let total_cells = cols * rows + rows * 2 + cols * 2;
        let target: Vec<bool> = (0..total_cells).map(|_| false).collect();
        let source: Vec<bool> = (0..total_cells)
            .map(|_| js_sys::Math::random() > 0.75)
            .collect();

        Universe {
            swap: false,
            updated_cells: (0..total_cells).map(|_| (0, 0, 0)).collect(),
            update_count: 0,
            cols,
            rows,
            source,
            target,
        }
    }

    /// Returns the current cell-list
    pub fn updated_cells(&mut self) -> *const (usize, usize, usize) {
        self.updated_cells.as_ptr()
    }

    pub fn update_count(&mut self) -> usize {
        self.update_count
    }

    /// Calculates the next generation
    pub fn next_gen(&mut self) {
        let updated_cells = &mut self.updated_cells;
        self.update_count = 0;

        let (src, tar) = if self.swap {
            (&mut self.target, &mut self.source)
        } else {
            (&mut self.source, &mut self.target)
        };

        for row in 1..self.rows {
            let offset = row * self.cols;
            let top = (row - 1) * self.cols + 1;
            let bottom = (row + 1) * self.cols + 1;

            let mut mask: u16 = (if src[top - 1] { 32 } else { 0 })
                + (if src[top] { 4 } else { 0 })
                + (if src[offset - 1] { 16 } else { 0 })
                + (if src[offset] { 2 } else { 0 })
                + (if src[bottom - 1] { 8 } else { 0 })
                + (if src[bottom] { 1 } else { 0 });

            for col in 1..self.cols {
                let middle = offset + col;

                // Shift previously saved information to the left and make room
                // For 3 additional bits (which will be used for the middle row).
                mask = ((mask << 3) & 0b111111111) + // Make room for three more bits
                    (if src[top + col] { 4 } else { 0 }) + // TR
                    (if src[middle + 1] { 2 } else { 0 }) + // MR
                    (if src[bottom + col] { 1 } else { 0 }); // BR

                // Lookup bits
                let neighbors = (mask & 0b1)
                    + (mask >> 1 & 0b1)
                    + (mask >> 2 & 0b1)
                    + (mask >> 3 & 0b1)
                    + (mask >> 5 & 0b1)
                    + (mask >> 6 & 0b1)
                    + (mask >> 7 & 0b1)
                    + (mask >> 8 & 0b1)
                    + (mask >> 9 & 0b1);

                let cell = src[middle];
                let next = if cell {
                    // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                    // Any live cell with two or three live neighbours lives on to the next generation.
                    // Any live cell with more than three live neighbours dies, as if by overpopulation.
                    (neighbors < 4 && neighbors > 1)
                } else {
                    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    neighbors == 3
                };

                // Save state
                tar[middle] = next;

                if cell != next {
                    // Save changed cell
                    updated_cells[self.update_count] = (
                        row as usize,
                        col as usize,
                        if tar[middle] { 1 } else { 0 } as usize,
                    );

                    self.update_count += 1;
                };
            }
        }

        self.swap = !self.swap;
    }
}
