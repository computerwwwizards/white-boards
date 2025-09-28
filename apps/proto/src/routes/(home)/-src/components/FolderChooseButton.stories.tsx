import type { Meta, StoryObj } from 'storybook-react-rsbuild'
import FolderChooseButton from './FolderChooseButton'

const meta: Meta<typeof FolderChooseButton> = {
  title: 'Routes/Home/FolderChooseButton',
  component: FolderChooseButton,
}

export default meta

type Story = StoryObj<typeof FolderChooseButton>

export const Default: Story = {
  args: {
    onClick: () => alert('Simulated folder picker'),
    children: 'Choose your Project (folder)',
  },
}

export const InPage:Story = {
  render(){
    return <div className='grid place-content-center bg-[#191919] h-screen'>
      <FolderChooseButton />
    </div>
  }
}