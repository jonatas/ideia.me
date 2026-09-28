import numpy as np
from Bio import PDB
from tmtools import tm_align

bait_path = 'assets/pdb/rubisco_bait.pdb'
orphan_path = 'assets/pdb/rubisco_orphan.pdb'

parser = PDB.PDBParser(QUIET=True)
s_bait = parser.get_structure('bait', bait_path)
s_orphan = parser.get_structure('orphan', orphan_path)

THREE_TO_ONE = {
    'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E', 'PHE': 'F',
    'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LYS': 'K', 'LEU': 'L',
    'MET': 'M', 'ASN': 'N', 'PRO': 'P', 'GLN': 'Q', 'ARG': 'R',
    'SER': 'S', 'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y'
}

def get_chain_coords(structure, chain_id):
    coords = []
    seq = []
    for model in structure:
        for chain in model:
            if chain.id == chain_id:
                for residue in chain:
                    if residue.resname in THREE_TO_ONE:
                        try:
                            ca = residue['CA']
                            coords.append(ca.get_coord())
                            seq.append(THREE_TO_ONE[residue.resname])
                        except KeyError:
                            pass
                break
    return np.array(coords), ''.join(seq)

coords_bait_L, seq_bait_L = get_chain_coords(s_bait, 'L')
coords_orphan_L, seq_orphan_L = get_chain_coords(s_orphan, 'L')

# SWAPPED: First arg is what gets moved (orphan), Second arg is the target (bait)
res = tm_align(coords_orphan_L, coords_bait_L, seq_orphan_L, seq_bait_L)
print(f"TM-score: {res.tm_norm_chain1:.4f}")

t = np.array(res.t)
u = np.array(res.u)

print("Applying transformation to the full structure...")
for atom in s_orphan.get_atoms():
    coord = atom.get_coord()
    new_coord = np.dot(u, coord) + t  # Correct matrix multiplication
    atom.set_coord(new_coord)

io = PDB.PDBIO()
io.set_structure(s_orphan)
io.save('assets/pdb/rubisco_orphan_aligned.pdb')
print("Saved assets/pdb/rubisco_orphan_aligned.pdb")
